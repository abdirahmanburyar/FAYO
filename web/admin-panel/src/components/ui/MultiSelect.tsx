'use client';

import React from 'react';
import SearchableSelect, { SelectOption } from './SearchableSelect';

interface MultiSelectProps {
  options: SelectOption[];
  value?: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  maxHeight?: string;
  allowClear?: boolean;
  noOptionsText?: string;
  loading?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  maxSelections?: number;
}

export default function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Select options...',
  searchPlaceholder = 'Search options...',
  disabled = false,
  className = '',
  maxHeight = '200px',
  allowClear = true,
  noOptionsText = 'No options found',
  loading = false,
  error,
  label,
  required = false,
  maxSelections,
}: MultiSelectProps) {
  const handleChange = (newValue: string | string[]) => {
    const values = Array.isArray(newValue) ? newValue : [];
    
    // Apply max selections limit
    if (maxSelections && values.length > maxSelections) {
      return;
    }
    
    onChange(values);
  };

  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      multiple={true}
      disabled={disabled}
      className={className}
      maxHeight={maxHeight}
      allowClear={allowClear}
      noOptionsText={noOptionsText}
      loading={loading}
      error={error}
      label={label}
      required={required}
    />
  );
}
