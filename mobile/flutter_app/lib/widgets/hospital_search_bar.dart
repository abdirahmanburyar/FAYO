import 'package:flutter/material.dart';

class HospitalSearchBar extends StatefulWidget {
  final Function(String) onSearchChanged;
  final Function(String) onCityChanged;
  final Function(String) onTypeChanged;
  final List<String> cities;
  final List<String> types;
  final String selectedCity;
  final String selectedType;

  const HospitalSearchBar({
    super.key,
    required this.onSearchChanged,
    required this.onCityChanged,
    required this.onTypeChanged,
    required this.cities,
    required this.types,
    required this.selectedCity,
    required this.selectedType,
  });

  @override
  State<HospitalSearchBar> createState() => _HospitalSearchBarState();
}

class _HospitalSearchBarState extends State<HospitalSearchBar> {
  final TextEditingController _searchController = TextEditingController();
  bool _showFilters = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Search Bar
        Container(
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: TextField(
            controller: _searchController,
            onChanged: widget.onSearchChanged,
            decoration: InputDecoration(
              hintText: 'Search hospitals, cities, or addresses...',
              hintStyle: TextStyle(color: Colors.grey[500]),
              prefixIcon: Icon(Icons.search, color: Colors.grey[600]),
              suffixIcon: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_searchController.text.isNotEmpty)
                    IconButton(
                      icon: Icon(Icons.clear, color: Colors.grey[600]),
                      onPressed: () {
                        _searchController.clear();
                        widget.onSearchChanged('');
                      },
                    ),
                  IconButton(
                    icon: Icon(
                      _showFilters ? Icons.filter_list : Icons.filter_list_outlined,
                      color: _showFilters ? Colors.blue[600] : Colors.grey[600],
                    ),
                    onPressed: () {
                      setState(() {
                        _showFilters = !_showFilters;
                      });
                    },
                  ),
                ],
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
          ),
        ),
        
        // Filters
        AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          height: _showFilters ? null : 0,
          child: _showFilters ? _buildFilters() : const SizedBox.shrink(),
        ),
      ],
    );
  }

  Widget _buildFilters() {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(
        children: [
          // City Filter
          _buildFilterRow(
            'City',
            widget.cities,
            widget.selectedCity,
            widget.onCityChanged,
            Icons.location_city,
          ),
          
          const SizedBox(height: 12),
          
          // Type Filter
          _buildFilterRow(
            'Type',
            widget.types,
            widget.selectedType,
            widget.onTypeChanged,
            Icons.category,
          ),
        ],
      ),
    );
  }

  Widget _buildFilterRow(
    String label,
    List<String> options,
    String selectedValue,
    Function(String) onChanged,
    IconData icon,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: Colors.grey[600]),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Colors.grey[700],
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 40,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: options.length,
            itemBuilder: (context, index) {
              final option = options[index];
              final isSelected = option == selectedValue;
              
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () => onChanged(option),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.blue[600] : Colors.grey[100],
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected ? Colors.blue[600]! : Colors.grey[300]!,
                      ),
                    ),
                    child: Text(
                      option,
                      style: TextStyle(
                        color: isSelected ? Colors.white : Colors.grey[700],
                        fontSize: 14,
                        fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
