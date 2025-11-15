'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SearchableSelect, MultiSelect, SelectOption } from '@/components/ui';
import { 
  Search, 
  Users, 
  Building2, 
  Stethoscope, 
  Calendar,
  Settings,
  Code,
  Palette,
  Zap
} from 'lucide-react';

export default function ComponentsDemoPage() {
  const [singleValue, setSingleValue] = useState('');
  const [multiValue, setMultiValue] = useState<string[]>([]);
  const [groupedValue, setGroupedValue] = useState('');
  const [loadingValue, setLoadingValue] = useState('');
  const [errorValue, setErrorValue] = useState('');
  const [disabledValue, setDisabledValue] = useState('');

  // Sample data
  const basicOptions: SelectOption[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
    { value: 'option4', label: 'Option 4' },
    { value: 'option5', label: 'Option 5' },
  ];

  const cityOptions: SelectOption[] = [
    { value: 'mogadishu', label: 'Mogadishu' },
    { value: 'hargeisa', label: 'Hargeisa' },
    { value: 'kismayo', label: 'Kismayo' },
    { value: 'berbera', label: 'Berbera' },
    { value: 'baidoa', label: 'Baidoa' },
    { value: 'beledweyne', label: 'Beledweyne' },
    { value: 'burao', label: 'Burao' },
    { value: 'galkayo', label: 'Galkayo' },
    { value: 'garowe', label: 'Garowe' },
    { value: 'jowhar', label: 'Jowhar' },
  ];

  const specialtyOptions: SelectOption[] = [
    { value: 'cardiology', label: 'Cardiology', group: 'Internal Medicine' },
    { value: 'neurology', label: 'Neurology', group: 'Internal Medicine' },
    { value: 'gastroenterology', label: 'Gastroenterology', group: 'Internal Medicine' },
    { value: 'general-surgery', label: 'General Surgery', group: 'Surgery' },
    { value: 'orthopedic', label: 'Orthopedic Surgery', group: 'Surgery' },
    { value: 'pediatric-surgery', label: 'Pediatric Surgery', group: 'Surgery' },
    { value: 'neonatology', label: 'Neonatology', group: 'Pediatrics' },
    { value: 'pediatric-cardiology', label: 'Pediatric Cardiology', group: 'Pediatrics' },
    { value: 'emergency-medicine', label: 'Emergency Medicine', group: 'Emergency' },
    { value: 'anesthesiology', label: 'Anesthesiology', group: 'Emergency' },
  ];

  const statusOptions: SelectOption[] = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
    { value: 'suspended', label: 'Suspended' },
  ];

  const roleOptions: SelectOption[] = [
    { value: 'admin', label: 'Administrator' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'patient', label: 'Patient' },
    { value: 'receptionist', label: 'Receptionist' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">UI Components Demo</h1>
        <p className="text-gray-600 mt-2">
          Interactive showcase of searchable select components
        </p>
      </div>

      {/* Basic Examples */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Basic Single Select */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Basic Single Select</h3>
              <p className="text-sm text-gray-600">Simple searchable dropdown</p>
            </div>
          </div>
          
          <SearchableSelect
            options={basicOptions}
            value={singleValue}
            onChange={setSingleValue}
            placeholder="Choose an option..."
            searchPlaceholder="Search options..."
            label="Select Option"
            allowClear
          />
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Selected:</strong> {singleValue || 'None'}
            </p>
          </div>
        </div>

        {/* Multi Select */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Multi Select</h3>
              <p className="text-sm text-gray-600">Select multiple options</p>
            </div>
          </div>
          
          <MultiSelect
            options={roleOptions}
            value={multiValue}
            onChange={setMultiValue}
            placeholder="Select roles..."
            searchPlaceholder="Search roles..."
            label="User Roles"
            maxSelections={3}
            allowClear
          />
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Selected:</strong> {multiValue.length > 0 ? multiValue.join(', ') : 'None'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Advanced Examples */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Grouped Options */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Grouped Options</h3>
              <p className="text-sm text-gray-600">Options organized by groups</p>
            </div>
          </div>
          
          <SearchableSelect
            options={specialtyOptions}
            value={groupedValue}
            onChange={setGroupedValue}
            placeholder="Select specialty..."
            searchPlaceholder="Search specialties..."
            label="Medical Specialty"
            allowClear
          />
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Selected:</strong> {groupedValue || 'None'}
            </p>
          </div>
        </div>

        {/* City Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">City Selection</h3>
              <p className="text-sm text-gray-600">Searchable city dropdown</p>
            </div>
          </div>
          
          <SearchableSelect
            options={cityOptions}
            value={loadingValue}
            onChange={setLoadingValue}
            placeholder="Select city..."
            searchPlaceholder="Search cities..."
            label="City"
            loading={false}
            allowClear
          />
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Selected:</strong> {loadingValue || 'None'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* State Examples */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Loading State */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Loading State</h3>
              <p className="text-sm text-gray-600">Shows loading spinner</p>
            </div>
          </div>
          
          <SearchableSelect
            options={statusOptions}
            value={loadingValue}
            onChange={setLoadingValue}
            placeholder="Loading options..."
            loading={true}
            disabled
          />
        </div>

        {/* Error State */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Error State</h3>
              <p className="text-sm text-gray-600">Shows validation error</p>
            </div>
          </div>
          
          <SearchableSelect
            options={statusOptions}
            value={errorValue}
            onChange={setErrorValue}
            placeholder="Select status..."
            label="Status"
            required
            error="This field is required"
          />
        </div>

        {/* Disabled State */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Disabled State</h3>
              <p className="text-sm text-gray-600">Component is disabled</p>
            </div>
          </div>
          
          <SearchableSelect
            options={statusOptions}
            value={disabledValue}
            onChange={setDisabledValue}
            placeholder="Disabled select..."
            disabled
          />
        </div>
      </motion.div>

      {/* Code Examples */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Palette className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Usage Examples</h3>
            <p className="text-sm text-gray-600">Code snippets for implementation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Basic Usage</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { SearchableSelect, SelectOption } from '@/components/ui';

const options: SelectOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
];

<SearchableSelect
  options={options}
  value={selectedValue}
  onChange={setSelectedValue}
  placeholder="Select an option..."
  searchPlaceholder="Search options..."
  allowClear
/>`}
            </pre>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Multi Select</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { MultiSelect, SelectOption } from '@/components/ui';

<MultiSelect
  options={options}
  value={selectedValues}
  onChange={setSelectedValues}
  placeholder="Select multiple..."
  maxSelections={5}
  allowClear
/>`}
            </pre>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
