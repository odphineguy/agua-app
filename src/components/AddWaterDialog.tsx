import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useHydration, FluidType } from '@/hooks/useHydration';
import { Droplets } from 'lucide-react';

interface AddWaterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddWaterDialog = ({ open, onOpenChange }: AddWaterDialogProps) => {
  const { fluidTypes, logWater } = useHydration();
  const { toast } = useToast();
  const [amount, setAmount] = useState('8');
  const [selectedFluidType, setSelectedFluidType] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Set default fluid type when dialog opens
  React.useEffect(() => {
    if (open && fluidTypes.length > 0 && !selectedFluidType) {
      // Find water type or use first available
      const waterType = fluidTypes.find(type => type.name.toLowerCase().includes('water'));
      setSelectedFluidType(waterType?.id || fluidTypes[0].id);
    }
  }, [open, fluidTypes, selectedFluidType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFluidType || !amount) {
      toast({
        title: "Missing information",
        description: "Please select a fluid type and enter an amount.",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    // Security: Enhanced validation
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > 64) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount between 0.1 and 64 oz.",
        variant: "destructive",
      });
      return;
    }

    // Security: Precision validation to prevent float precision exploits
    const decimalPlaces = (amount.split('.')[1] || '').length;
    if (decimalPlaces > 1) {
      toast({
        title: "Invalid precision",
        description: "Amount can only have one decimal place.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await logWater(amountNum, selectedFluidType);
      
      const selectedFluid = fluidTypes.find(type => type.id === selectedFluidType);
      toast({
        title: "Water logged!",
        description: `Added ${amountNum} oz of ${selectedFluid?.name || 'fluid'} to your daily intake.`,
      });
      
      onOpenChange(false);
      setAmount('8');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log water intake",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [4, 8, 12, 16, 20, 24];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Droplets className="w-5 h-5 text-primary" />
            <span>Add Water Intake</span>
          </DialogTitle>
          <DialogDescription>
            Log your hydration to track your daily progress
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Amount Buttons */}
          <div>
            <Label className="text-sm font-medium">Quick amounts (oz)</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className={amount === quickAmount.toString() ? 'border-primary bg-primary/10' : ''}
                >
                  {quickAmount} oz
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (oz)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="8"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.1"
              max="64"
              step="0.1"
            />
          </div>

          {/* Fluid Type */}
          <div className="space-y-2">
            <Label htmlFor="fluid-type">Fluid Type</Label>
            <Select value={selectedFluidType} onValueChange={setSelectedFluidType}>
              <SelectTrigger>
                <SelectValue placeholder="Select fluid type" />
              </SelectTrigger>
              <SelectContent>
                {fluidTypes.map((fluidType) => (
                  <SelectItem key={fluidType.id} value={fluidType.id}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: fluidType.color }}
                      />
                      <span>{fluidType.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round(fluidType.hydration_factor * 100)}% hydration)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Logging...' : 'Log Water'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWaterDialog;