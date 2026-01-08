<!-- @format -->

# 🚀 Production Deployment Guide

## 📋 Prerequisites

1. **Domain Name**: You need a domain pointing to your server
2. **Server Access**: SSH access to your server
3. **Docker & Docker Compose**: Installed on server
4. **Ports Open**: 80 and 443 must be accessible

## 🔧 Step-by-Step Deployment

### 1. **Prepare Your Domain**

```bash
# Point your domain to your server's IP address
# Example: api.pickleball-db.com → YOUR_SERVER_IP
```

### 2. **Deploy Services**

```bash
# Build and start all services
docker-compose up -d --build
```

### 3. **Configure SSL Certificate**

```bash
# Edit the email in setup-ssl.sh
nano setup-ssl.sh

# Run SSL setup (replace with your domain)
./setup-ssl.sh api.pickleball-db.com
```

### 4. **Verify Deployment**

```bash
# Check all containers are running
docker-compose ps

# Test health endpoint
curl https://api.pickleball-db.com/health

# Test API endpoint
curl https://api.pickleball-db.com/api/paddles
```

## 🔐 SSL Certificate Management

### **Automatic Renewal**

- Certificates auto-renew daily at 12 PM
- Renewal script: `/usr/local/bin/renew-ssl.sh`

### **Manual Renewal**

```bash
docker exec pickleball-nginx certbot renew
docker exec pickleball-nginx nginx -s reload
```

### **Check Certificate Status**

```bash
docker exec pickleball-nginx certbot certificates
```

## 📊 Monitoring

### **View Logs**

```bash
# Nginx logs
docker-compose logs nginx

# API logs
docker-compose logs api

# Database logs
docker-compose logs postgres
```

### **Health Checks**

```bash
# Check container health
docker-compose ps

# Test endpoints
curl -I https://your-domain.com/health
curl -I https://your-domain.com/api/paddles
```

## 🔧 Configuration Files

### **nginx.conf**

- Reverse proxy configuration
- SSL/TLS settings
- CORS headers
- Security headers

### **docker-compose.yml**

- Multi-service orchestration
- Volume management
- Network configuration

## 🚨 Troubleshooting

### **SSL Certificate Issues**

```bash
# Check certificate status
docker exec pickleball-nginx certbot certificates

# Force renewal
docker exec pickleball-nginx certbot renew --force-renewal

# Check nginx configuration
docker exec pickleball-nginx nginx -t
```

### **Port Conflicts**

```bash
# Check what's using ports 80/443
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### **Container Issues**

```bash
# Restart specific service
docker-compose restart nginx

# Rebuild and restart
docker-compose up -d --build --force-recreate
```

## 📈 Performance Optimization

### **Nginx Tuning**

```nginx
# Add to nginx.conf for better performance
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_types text/plain application/json;
```

### **Database Optimization**

```sql
-- PostgreSQL tuning
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
```

## 🔒 Security Checklist

- ✅ SSL/TLS enabled
- ✅ Security headers configured
- ✅ CORS properly configured
- ✅ Database not exposed externally
- ✅ Automatic SSL renewal
- ✅ Container health checks
- ✅ Log monitoring

## 📞 Support

For issues:

1. Check container logs: `docker-compose logs`
2. Verify SSL status: `docker exec pickleball-nginx certbot certificates`
3. Test connectivity: `curl -I https://your-domain.com/health`
