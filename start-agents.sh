#!/bin/bash
# start-agents.sh - Start all AI Dream Team agents

echo "🚀 Starting AI Dream Team Multi-Bot Setup..."
echo ""

# Check if configs exist
for agent in visionary factchecker storyteller visualarch coder project-management; do
    if [ ! -f "$HOME/.openclaw/agents-config/$agent.json" ]; then
        echo "❌ Missing config: ~/.openclaw/agents-config/$agent.json"
        exit 1
    fi
done

echo "✅ All configs found"
echo ""

# Function to start an agent
start_agent() {
    local agent=$1
    local port=$2
    echo "🔄 Starting $agent on port $port..."
    
    # Check if already running
    if pgrep -f "openclaw.*$agent.json" > /dev/null; then
        echo "   ⚠️  $agent already running"
        return
    fi
    
    # Start in background
    cd ~/.openclaw/workspace
    OPENCLAW_CONFIG="$HOME/.openclaw/agents-config/$agent.json" openclaw gateway start --background
    
    sleep 2
    
    # Check if started
    if pgrep -f "openclaw.*$agent.json" > /dev/null; then
        echo "   ✅ $agent started"
    else
        echo "   ❌ $agent failed to start"
    fi
}

# Start each agent
start_agent "visionary" "18790"
start_agent "factchecker" "18791"
start_agent "storyteller" "18792"
start_agent "visualarch" "18793"
start_agent "coder" "18794"
start_agent "project-management" "18795"

echo ""
echo "📊 Agent Status:"
echo "================"
for agent in visionary factchecker storyteller visualarch coder project-management; do
    if pgrep -f "openclaw.*$agent.json" > /dev/null; then
        echo "✅ $agent: Running"
    else
        echo "❌ $agent: Stopped"
    fi
done

echo ""
echo "📝 To check individual agent: OPENCLAW_CONFIG=~/.openclaw/agents-config/visionary.json openclaw status"
echo "🛑 To stop all: pkill -f 'openclaw.*agents-config'"
