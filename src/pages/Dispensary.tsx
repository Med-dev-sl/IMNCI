import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, AlertTriangle, Search, Pill, History } from 'lucide-react';
import { format } from 'date-fns';

type Medication = {
  id: string;
  name: string;
  generic_name: string | null;
  unit: string;
  category: string | null;
};

type InventoryItem = {
  id: string;
  medication_id: string;
  quantity: number;
  batch_number: string | null;
  expiry_date: string | null;
  facility_name: string | null;
  reorder_level: number | null;
  medications: Medication;
};

type DispensingRecord = {
  id: string;
  quantity_dispensed: number;
  notes: string | null;
  dispensed_at: string;
  inventory: {
    medications: {
      name: string;
      unit: string;
    };
  };
  patients: {
    first_name: string;
    last_name: string;
  } | null;
  cases: {
    case_number: string;
  } | null;
};

export default function Dispensary() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [dispenseOpen, setDispenseOpen] = useState(false);
  
  // Form states
  const [selectedMedication, setSelectedMedication] = useState('');
  const [quantity, setQuantity] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [reorderLevel, setReorderLevel] = useState('10');
  
  // Dispense form states
  const [selectedInventory, setSelectedInventory] = useState('');
  const [dispenseQuantity, setDispenseQuantity] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedCase, setSelectedCase] = useState('');
  const [dispenseNotes, setDispenseNotes] = useState('');

  const canManageInventory = role === 'pharmacy' || role === 'admin';

  // Fetch medications catalog
  const { data: medications } = useQuery({
    queryKey: ['medications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Medication[];
    },
  });

  // Fetch inventory with medication details
  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*, medications(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  // Fetch dispensing records
  const { data: dispensingRecords } = useQuery({
    queryKey: ['dispensing-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dispensing_records')
        .select(`
          *,
          inventory:inventory_id(medications(name, unit)),
          patients(first_name, last_name),
          cases(case_number)
        `)
        .order('dispensed_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as DispensingRecord[];
    },
  });

  // Fetch patients for dispensing
  const { data: patients } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: async () => {
      let query = supabase
        .from('patients')
        .select('id, first_name, last_name, registration_number')
        .limit(10);
      
      if (patientSearch) {
        query = query.or(`first_name.ilike.%${patientSearch}%,last_name.ilike.%${patientSearch}%,registration_number.ilike.%${patientSearch}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: dispenseOpen,
  });

  // Fetch cases for selected patient
  const { data: patientCases } = useQuery({
    queryKey: ['patient-cases', selectedPatient],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_number, chief_complaint')
        .eq('patient_id', selectedPatient)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatient,
  });

  // Add stock mutation
  const addStockMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('inventory').insert({
        medication_id: selectedMedication,
        quantity: parseInt(quantity),
        batch_number: batchNumber || null,
        expiry_date: expiryDate || null,
        facility_name: facilityName || null,
        reorder_level: parseInt(reorderLevel) || 10,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: 'Stock added successfully' });
      setAddStockOpen(false);
      resetStockForm();
    },
    onError: (error) => {
      toast({ title: 'Error adding stock', description: error.message, variant: 'destructive' });
    },
  });

  // Dispense medication mutation
  const dispenseMutation = useMutation({
    mutationFn: async () => {
      const inventoryItem = inventory?.find(i => i.id === selectedInventory);
      if (!inventoryItem) throw new Error('Inventory item not found');
      
      const qty = parseInt(dispenseQuantity);
      if (qty > inventoryItem.quantity) {
        throw new Error('Insufficient stock');
      }

      // Create dispensing record
      const { error: dispenseError } = await supabase.from('dispensing_records').insert({
        inventory_id: selectedInventory,
        patient_id: selectedPatient || null,
        case_id: selectedCase || null,
        quantity_dispensed: qty,
        dispensed_by: user?.id,
        notes: dispenseNotes || null,
      });
      if (dispenseError) throw dispenseError;

      // Update inventory quantity
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: inventoryItem.quantity - qty })
        .eq('id', selectedInventory);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dispensing-records'] });
      toast({ title: 'Medication dispensed successfully' });
      setDispenseOpen(false);
      resetDispenseForm();
    },
    onError: (error) => {
      toast({ title: 'Error dispensing medication', description: error.message, variant: 'destructive' });
    },
  });

  const resetStockForm = () => {
    setSelectedMedication('');
    setQuantity('');
    setBatchNumber('');
    setExpiryDate('');
    setFacilityName('');
    setReorderLevel('10');
  };

  const resetDispenseForm = () => {
    setSelectedInventory('');
    setDispenseQuantity('');
    setPatientSearch('');
    setSelectedPatient('');
    setSelectedCase('');
    setDispenseNotes('');
  };

  const filteredInventory = inventory?.filter(item =>
    item.medications.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.medications.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.batch_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory?.filter(item => 
    item.quantity <= (item.reorder_level || 10)
  );

  const getStockBadge = (quantity: number, reorderLevel: number | null) => {
    const level = reorderLevel || 10;
    if (quantity === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (quantity <= level) return <Badge className="bg-yellow-500">Low Stock</Badge>;
    return <Badge className="bg-green-500">In Stock</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pharmacy Dispensary</h1>
          <p className="text-muted-foreground">Manage medication inventory and dispensing</p>
        </div>
        {canManageInventory && (
          <div className="flex gap-2">
            <Dialog open={addStockOpen} onOpenChange={setAddStockOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Medication Stock</DialogTitle>
                  <DialogDescription>Add new stock to the inventory</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Medication *</Label>
                    <Select value={selectedMedication} onValueChange={setSelectedMedication}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select medication" />
                      </SelectTrigger>
                      <SelectContent>
                        {medications?.map(med => (
                          <SelectItem key={med.id} value={med.id}>
                            {med.name} ({med.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reorder Level</Label>
                      <Input
                        type="number"
                        value={reorderLevel}
                        onChange={(e) => setReorderLevel(e.target.value)}
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Batch Number</Label>
                    <Input
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="Enter batch number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Facility Name</Label>
                    <Input
                      value={facilityName}
                      onChange={(e) => setFacilityName(e.target.value)}
                      placeholder="Enter facility name"
                    />
                  </div>
                  <Button 
                    onClick={() => addStockMutation.mutate()} 
                    disabled={!selectedMedication || !quantity || addStockMutation.isPending}
                    className="w-full"
                  >
                    {addStockMutation.isPending ? 'Adding...' : 'Add Stock'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={dispenseOpen} onOpenChange={setDispenseOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Pill className="h-4 w-4 mr-2" />
                  Dispense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Dispense Medication</DialogTitle>
                  <DialogDescription>Record medication dispensing to a patient</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Medication *</Label>
                    <Select value={selectedInventory} onValueChange={setSelectedInventory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select from inventory" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory?.filter(i => i.quantity > 0).map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.medications.name} - {item.quantity} {item.medications.unit} available
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity to Dispense *</Label>
                    <Input
                      type="number"
                      value={dispenseQuantity}
                      onChange={(e) => setDispenseQuantity(e.target.value)}
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Search Patient</Label>
                    <Input
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      placeholder="Search by name or registration number"
                    />
                  </div>
                  {patients && patients.length > 0 && (
                    <div className="space-y-2">
                      <Label>Select Patient</Label>
                      <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.first_name} {p.last_name} ({p.registration_number})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {patientCases && patientCases.length > 0 && (
                    <div className="space-y-2">
                      <Label>Link to Case (Optional)</Label>
                      <Select value={selectedCase} onValueChange={setSelectedCase}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select case" />
                        </SelectTrigger>
                        <SelectContent>
                          {patientCases.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.case_number} - {c.chief_complaint}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={dispenseNotes}
                      onChange={(e) => setDispenseNotes(e.target.value)}
                      placeholder="Add any notes..."
                    />
                  </div>
                  <Button 
                    onClick={() => dispenseMutation.mutate()} 
                    disabled={!selectedInventory || !dispenseQuantity || dispenseMutation.isPending}
                    className="w-full"
                  >
                    {dispenseMutation.isPending ? 'Dispensing...' : 'Dispense Medication'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Low Stock Alert */}
      {lowStockItems && lowStockItems.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map(item => (
                <Badge key={item.id} variant="outline" className="border-yellow-500 text-yellow-700">
                  {item.medications.name}: {item.quantity} {item.medications.unit}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Dispensing History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Medication Inventory</CardTitle>
                  <CardDescription>Current stock levels and medication details</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search medications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading inventory...</div>
              ) : filteredInventory && filteredInventory.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medication</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.medications.name}</div>
                              {item.medications.generic_name && (
                                <div className="text-sm text-muted-foreground">{item.medications.generic_name}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.medications.category || '-'}</TableCell>
                          <TableCell>
                            <span className="font-medium">{item.quantity}</span> {item.medications.unit}
                          </TableCell>
                          <TableCell>{item.batch_number || '-'}</TableCell>
                          <TableCell>
                            {item.expiry_date ? format(new Date(item.expiry_date), 'MMM yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            {getStockBadge(item.quantity, item.reorder_level)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No medications found matching your search' : 'No inventory items yet'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Dispensing History</CardTitle>
              <CardDescription>Recent medication dispensing records</CardDescription>
            </CardHeader>
            <CardContent>
              {dispensingRecords && dispensingRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Medication</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Case</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dispensingRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {format(new Date(record.dispensed_at), 'dd MMM yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{record.inventory?.medications?.name}</div>
                          </TableCell>
                          <TableCell>
                            {record.quantity_dispensed} {record.inventory?.medications?.unit}
                          </TableCell>
                          <TableCell>
                            {record.patients 
                              ? `${record.patients.first_name} ${record.patients.last_name}`
                              : '-'
                            }
                          </TableCell>
                          <TableCell>{record.cases?.case_number || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate">{record.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No dispensing records yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
