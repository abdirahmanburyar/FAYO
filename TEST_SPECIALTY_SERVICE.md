# Test Specialty Service Connection

## Test from Host Machine

```bash
# Test specialty-service directly
curl http://localhost:3004/api/v1/health
curl http://31.97.58.62:3004/api/v1/health

# Test specialty-service specialties endpoint
curl http://localhost:3004/api/v1/specialties
curl http://31.97.58.62:3004/api/v1/specialties

# Test admin-panel proxy route (from host)
curl http://localhost:3000/api/v1/specialties
curl http://31.97.58.62:3000/api/v1/specialties
```

## Check Admin Panel Logs

```bash
# Check if admin-panel is running
docker ps | grep admin-panel

# Check admin-panel logs for errors
docker logs admin-panel --tail 100

# Check if the API route is accessible
docker logs admin-panel | grep -i "specialties\|specialty"
```

## Check Network Connectivity

```bash
# Check if admin-panel can reach specialty-service
docker exec admin-panel node -e "require('http').get('http://specialty-service:3004/api/v1/health', (res) => { console.log('Status:', res.statusCode); process.exit(res.statusCode === 200 ? 0 : 1); })"
```

## Rebuild Admin Panel

If the proxy routes aren't working, rebuild:

```bash
cd /root/fayo
docker compose -f docker-compose.prod.yml build admin-panel
docker compose -f docker-compose.prod.yml up -d admin-panel
sleep 20
docker logs admin-panel --tail 50
```

