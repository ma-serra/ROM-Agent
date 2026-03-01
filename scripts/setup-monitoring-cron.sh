#!/bin/bash
# ROM Agent - Setup Monitoring Cron Job
#
# Este script configura um cron job para monitoramento automático do sistema
#
# Uso:
#   bash scripts/setup-monitoring-cron.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MONITOR_SCRIPT="$PROJECT_DIR/scripts/monitor-system.js"

echo "==============================================="
echo "ROM Agent - Setup Monitoring Cron Job"
echo "==============================================="
echo ""

# Verificar se o script de monitoramento existe
if [ ! -f "$MONITOR_SCRIPT" ]; then
    echo "❌ Error: Monitoring script not found at $MONITOR_SCRIPT"
    exit 1
fi

echo "Project directory: $PROJECT_DIR"
echo "Monitor script: $MONITOR_SCRIPT"
echo ""

# Criar log do cron
CRON_LOG="$PROJECT_DIR/logs/cron-monitoring.log"
mkdir -p "$(dirname "$CRON_LOG")"

echo "Cron log will be saved to: $CRON_LOG"
echo ""

# Propor linhas de cron
echo "Suggested cron jobs:"
echo ""
echo "# Monitoramento a cada 5 minutos (recomendado para produção)"
echo "*/5 * * * * cd $PROJECT_DIR && node scripts/monitor-system.js >> $CRON_LOG 2>&1"
echo ""
echo "# Monitoramento a cada 15 minutos (para desenvolvimento)"
echo "*/15 * * * * cd $PROJECT_DIR && node scripts/monitor-system.js >> $CRON_LOG 2>&1"
echo ""
echo "# Monitoramento a cada hora"
echo "0 * * * * cd $PROJECT_DIR && node scripts/monitor-system.js >> $CRON_LOG 2>&1"
echo ""

# Perguntar se quer adicionar ao crontab
echo "Would you like to add monitoring to your crontab? (y/n)"
read -r RESPONSE

if [ "$RESPONSE" = "y" ] || [ "$RESPONSE" = "Y" ]; then
    echo ""
    echo "Choose monitoring interval:"
    echo "  1) Every 5 minutes (recommended)"
    echo "  2) Every 15 minutes"
    echo "  3) Every hour"
    echo "  4) Custom"
    read -r INTERVAL_CHOICE

    case $INTERVAL_CHOICE in
        1)
            CRON_SCHEDULE="*/5 * * * *"
            ;;
        2)
            CRON_SCHEDULE="*/15 * * * *"
            ;;
        3)
            CRON_SCHEDULE="0 * * * *"
            ;;
        4)
            echo "Enter cron schedule (e.g., */10 * * * * for every 10 min):"
            read -r CRON_SCHEDULE
            ;;
        *)
            echo "❌ Invalid choice"
            exit 1
            ;;
    esac

    CRON_LINE="$CRON_SCHEDULE cd $PROJECT_DIR && node scripts/monitor-system.js >> $CRON_LOG 2>&1"

    # Verificar se já existe
    if crontab -l 2>/dev/null | grep -q "monitor-system.js"; then
        echo ""
        echo "⚠️  Monitoring job already exists in crontab"
        echo "Remove it first with: crontab -e"
    else
        # Adicionar ao crontab
        (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
        echo ""
        echo "✅ Cron job added successfully!"
        echo ""
        echo "Schedule: $CRON_SCHEDULE"
        echo "Command: cd $PROJECT_DIR && node scripts/monitor-system.js"
        echo "Log: $CRON_LOG"
    fi
else
    echo ""
    echo "Skipping crontab setup."
    echo "You can add it manually later with:"
    echo "  crontab -e"
    echo ""
    echo "Then add one of the suggested lines above."
fi

echo ""
echo "==============================================="
echo "Setup complete!"
echo ""
echo "To test the monitoring script manually:"
echo "  node scripts/monitor-system.js"
echo ""
echo "To run in watch mode (continuous):"
echo "  node scripts/monitor-system.js --watch"
echo ""
echo "To view cron logs:"
echo "  tail -f $CRON_LOG"
echo "==============================================="
