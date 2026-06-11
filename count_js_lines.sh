#!/bin/bash
# Script to count lines of code in the YAYPOKER project
# Ignores node_modules, dist, and logs folders.

echo "==========================================="
echo "       YAYPOKER CODE LINE COUNTER          "
echo "==========================================="

count_lines() {
    local folder=$1
    local name=$2
    local extensions=$3
    
    if [ ! -d "$folder" ]; then
        printf "%-20s : %8d lines\n" "$name" 0
        return 0
    fi

    # Use eval to properly expand the extensions variable
    local lines=$(eval "find \"$folder\" -name \"node_modules\" -prune -o -name \"dist\" -prune -o -name \".git\" -prune -o -type f \( $extensions \) -print0" | xargs -0 wc -l 2>/dev/null | tail -n 1 | awk '{print $1}')
    
    if [ -z "$lines" ]; then
        lines=0
    fi
    
    printf "%-20s : %8d lines\n" "$name" "$lines"
    
    # Store in a global variable dynamically based on folder
    if [[ "$folder" == *"webSocket"* ]]; then WS_LINES=$lines; fi
    if [[ "$folder" == *"client"* ]]; then CLIENT_LINES=$lines; fi
    if [[ "$folder" == *"bot"* ]]; then BOT_LINES=$lines; fi
}

# 1. WebSocket Server (Node.js)
count_lines "./webSocket" "WebSocket Server" "-name '*.js'"

# 2. Client (Vue.js + JS)
count_lines "./client" "Vue Client" "-name '*.js' -o -name '*.vue'"

# 3. Bot Service (Node.js)
count_lines "./bot" "Bot Service" "-name '*.js'"

# 4. Docker configuration files
DOCKER_LINES=$(find . -maxdepth 1 -name "Dockerfile*" -o -name "docker-compose*.yml" | xargs wc -l 2>/dev/null | tail -n 1 | awk '{print $1}')
if [ -z "$DOCKER_LINES" ]; then
    DOCKER_LINES=0
fi
printf "%-20s : %8d lines\n" "Docker Files" "$DOCKER_LINES"

# 5. Grand Total
echo "-------------------------------------------"
GRAND_TOTAL=$((WS_LINES + CLIENT_LINES + BOT_LINES + DOCKER_LINES))
printf "%-20s : %8d lines\n" "GRAND TOTAL" "$GRAND_TOTAL"
echo "==========================================="
