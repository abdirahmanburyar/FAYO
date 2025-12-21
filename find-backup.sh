#!/bin/bash
# Find backup files on the system

echo "🔍 Searching for backup files..."
echo ""

# Common backup locations
SEARCH_PATHS=(
    "/root/backup"
    "/root"
    "/root/fayo/backups"
    "/root/fayo"
    "/var/backups"
    "/tmp"
    "."
)

FOUND_FILES=()

for path in "${SEARCH_PATHS[@]}"; do
    if [ -d "$path" ]; then
        # Search for SQL backup files
        while IFS= read -r -d '' file; do
            FOUND_FILES+=("$file")
        done < <(find "$path" -name "*fayo*.sql*" -type f -print0 2>/dev/null)
    fi
done

if [ ${#FOUND_FILES[@]} -eq 0 ]; then
    echo "❌ No backup files found with pattern '*fayo*.sql*'"
    echo ""
    echo "📋 Searched in:"
    for path in "${SEARCH_PATHS[@]}"; do
        echo "   - $path"
    done
    echo ""
    echo "💡 Try searching manually:"
    echo "   find /root -name '*fayo*.sql*' -type f 2>/dev/null"
    echo "   find /root -name '*backup*.sql*' -type f 2>/dev/null"
else
    echo "✅ Found ${#FOUND_FILES[@]} backup file(s):"
    echo ""
    for i in "${!FOUND_FILES[@]}"; do
        file="${FOUND_FILES[$i]}"
        size=$(du -h "$file" | cut -f1)
        date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1 || echo "unknown")
        echo "   $((i+1)). $file"
        echo "      Size: $size | Date: $date"
    done
    echo ""
    echo "📝 To restore, use:"
    echo "   sudo -u postgres psql -d fayo < <backup_file_path>"
fi

