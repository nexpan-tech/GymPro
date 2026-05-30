#!/usr/bin/env bash
set -euo pipefail
echo "=== GymPro Health Check ==="
curl -sf http://localhost:5050/api/v1/health && echo " OK: health"
curl -sf http://localhost:5050/api/v1/health/ready && echo " OK: readiness"
curl -s http://localhost:5050/api/v1/health/metrics | head -2 && echo " OK: metrics"
curl -sf http://localhost:3000/api/health && echo " OK: grafana"
curl -sf http://localhost:9090/-/ready && echo " OK: prometheus"
docker ps --filter name=gympro --format "table {{.Names}}	{{.Status}}"
echo "=== Done ==="
