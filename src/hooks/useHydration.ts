import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FluidType {
  id: string;
  name: string;
  color: string;
  hydration_factor: number;
}

export interface HydrationLog {
  id: string;
  amount_oz: number;
  fluid_type_id: string;
  logged_at: string;
  date: string;
}

export interface DailyProgress {
  date: string;
  total_oz: number;
  goal_oz: number;
  percentage: number;
}

export const useHydration = () => {
  const { user } = useAuth();
  const [fluidTypes, setFluidTypes] = useState<FluidType[]>([]);
  const [todayProgress, setTodayProgress] = useState<DailyProgress>({
    date: new Date().toISOString().split('T')[0],
    total_oz: 0,
    goal_oz: 64,
    percentage: 0
  });
  const [weeklyStreak, setWeeklyStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // Calculate daily goal based on profile
  const calculateDailyGoal = (weight?: number, sex?: string, activity_level?: string) => {
    if (!weight) return 64; // Default 64 oz
    
    // Base calculation: 0.5-1 oz per pound of body weight
    let baseOz = weight * 0.67;
    
    // Adjust for sex
    if (sex === 'male') {
      baseOz *= 1.1;
    }
    
    // Adjust for activity level
    const activityMultipliers = {
      'sedentary': 1.0,
      'lightly_active': 1.1,
      'moderately_active': 1.2,
      'very_active': 1.3,
      'extremely_active': 1.4
    };
    
    const multiplier = activityMultipliers[activity_level as keyof typeof activityMultipliers] || 1.0;
    
    return Math.round(baseOz * multiplier);
  };

  useEffect(() => {
    if (user) {
      fetchFluidTypes();
      fetchTodayProgress();
      fetchWeeklyStreak();
    }
  }, [user]);

  const fetchFluidTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('fluid_types')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setFluidTypes(data || []);
    } catch (error) {
      console.error('Error fetching fluid types:', error);
    }
  };

  const fetchTodayProgress = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get user profile for goal calculation
      const { data: profile } = await supabase
        .from('profiles')
        .select('weight, sex, activity_level')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const dailyGoal = calculateDailyGoal(profile?.weight, profile?.sex, profile?.activity_level);
      
      // Get today's hydration logs with fluid types
      const { data: logs, error } = await supabase
        .from('hydration_logs')
        .select(`
          amount_oz,
          fluid_types!inner (hydration_factor)
        `)
        .eq('user_id', user.id)
        .eq('date', today);
      
      if (error) throw error;
      
      // Calculate total hydrated ounces (considering hydration factors)
      const totalOz = logs?.reduce((sum, log) => {
        const factor = (log.fluid_types as any)?.hydration_factor || 1;
        return sum + (log.amount_oz * factor);
      }, 0) || 0;
      
      setTodayProgress({
        date: today,
        total_oz: totalOz,
        goal_oz: dailyGoal,
        percentage: Math.min(Math.round((totalOz / dailyGoal) * 100), 100)
      });
    } catch (error) {
      console.error('Error fetching today progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyStreak = async () => {
    if (!user) return;
    
    try {
      // Get user profile for goal calculation
      const { data: profile } = await supabase
        .from('profiles')
        .select('weight, sex, activity_level')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const dailyGoal = calculateDailyGoal(profile?.weight, profile?.sex, profile?.activity_level);
      
      // Get last 30 days of data to calculate streak
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: logs, error } = await supabase
        .from('hydration_logs')
        .select(`
          date,
          amount_oz,
          fluid_types (hydration_factor)
        `)
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      // Group by date and calculate daily totals
      const dailyTotals = logs?.reduce((acc, log) => {
        const factor = (log.fluid_types as any)?.hydration_factor || 1;
        const effectiveOz = log.amount_oz * factor;
        
        if (!acc[log.date]) {
          acc[log.date] = 0;
        }
        acc[log.date] += effectiveOz;
        return acc;
      }, {} as Record<string, number>) || {};
      
      // Calculate streak from today backwards
      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateString = checkDate.toISOString().split('T')[0];
        
        const dailyTotal = dailyTotals[dateString] || 0;
        
        if (dailyTotal >= dailyGoal) {
          streak++;
        } else {
          break; // Streak is broken
        }
      }
      
      setWeeklyStreak(streak);
    } catch (error) {
      console.error('Error fetching weekly streak:', error);
    }
  };

  const logWater = async (amount_oz: number, fluid_type_id: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const { error } = await supabase
      .from('hydration_logs')
      .insert({
        user_id: user.id,
        amount_oz,
        fluid_type_id,
        date: new Date().toISOString().split('T')[0]
      });
    
    if (error) throw error;
    
    // Refresh data
    await fetchTodayProgress();
    await fetchWeeklyStreak();
  };

  return {
    fluidTypes,
    todayProgress,
    weeklyStreak,
    loading,
    logWater,
    refreshData: () => {
      fetchTodayProgress();
      fetchWeeklyStreak();
    }
  };
};