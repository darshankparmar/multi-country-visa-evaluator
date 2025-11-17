# Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Visa Evaluation Backend API to production environments. It covers environment setup, database configuration, deployment strategies, monitoring, and best practices for running a secure and scalable production system.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [MongoDB Setup](#mongodb-setup)
4. [Application Deployment](#application-deployment)
5. [Reverse Proxy Configuration](#reverse-proxy-configuration)
6. [SSL/HTTPS Setup](#ssl-https-setup)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Backup and Recovery](#backup-and-recovery)
9. [Scaling Considerations](#scaling-considerations)
10. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying to production, ensure you have:

- [ ] Production server with Node.js 18+ installed
- [ ] MongoDB instance (local or cloud-based)
- [ ] Domain name configured with DNS
- [ ] SSL certificate (Let's Encrypt or commercial)
- [ ] SMTP server credentials (if email enabled)
- [ ] OpenAI API key (if using AI evaluator)
- [ ] Backup strategy planned
- [ ] Monitoring tools configured
- [ ] Security review completed
- [ ] Load testing performed

---

## Environment Setup

### Server Requirements

**Minimum Specifications**:
- **CPU**: 2 cores
- **RAM**: 2GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04 LTS or later (recommended)

**Recommended Specifications**:
- **CPU**: 4 cores
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **OS**: Ubuntu 22.04 LTS

### Install Node.js

```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be v18.x or higher
npm --version   # Should be v8.x or higher
```

### Install PM2 Process Manager

PM2 is recommended for managing Node.js applications in production:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### Create Application User

Run the application as a non-root user for security:

```bash
# Create user
sudo useradd -m -s /bin/bash visaapi

# Create application directory
sudo mkdir -p /opt/visa-api
sudo chown visaapi:visaapi /opt/visa-api
```

### Clone and Build Application

```bash
# Switch to application user
sudo su - visaapi

# Navigate to application directory
cd /opt/visa-api

# Clone repository (or upload files)
git clone <repository-url> .

# Navigate to backend
cd backend

# Install dependencies
npm ci --only=production

# Build TypeScript
npm run build
```

---

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended)

MongoDB Atlas provides a fully managed cloud database with automatic backups, scaling, and monitoring.

**Steps**:

1. **Create Account**: Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Create Cluster**:
   - Choose cloud provider (AWS, GCP, Azure)
   - Select region closest to your application server
   - Choose cluster tier (M10+ for production)

3. **Configure Security**:
   - Create database user with strong password
   - Add IP whitelist (application server IP)
   - Enable VPC peering for enhanced security (optional)

4. **Get Connection String**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/visa-evaluation?retryWrites=true&w=majority
   ```

5. **Configure Connection Options**:
   - Enable connection pooling
   - Set appropriate timeouts
   - Enable SSL/TLS

**Atlas Benefits**:
- Automatic backups
- Point-in-time recovery
- Monitoring and alerts
- Automatic scaling
- 99.995% SLA

### Option 2: Self-Hosted MongoDB

For self-hosted deployments:

**Install MongoDB**:

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
sudo systemctl status mongod
```

**Configure MongoDB**:

Edit `/etc/mongod.conf`:

```yaml
# Network interfaces
net:
  port: 27017
  bindIp: 127.0.0.1  # Change to 0.0.0.0 for remote access

# Security
security:
  authorization: enabled

# Storage
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

# Replication (for high availability)
replication:
  replSetName: "rs0"
```

**Create Database User**:

```bash
mongosh

use admin
db.createUser({
  user: "visaapi",
  pwd: "strong-password-here",
  roles: [
    { role: "readWrite", db: "visa-evaluation" }
  ]
})
```

**Connection String**:
```
mongodb://visaapi:strong-password-here@localhost:27017/visa-evaluation?authSource=admin
```

---

## Application Deployment

### Configure Environment Variables

Create production `.env` file:

```bash
cd /opt/visa-api/backend
nano .env
```

**Production Environment Configuration**:

```bash
# Server
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/visa-evaluation?retryWrites=true&w=majority

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Evaluation
SUCCESS_CAP=85
EVALUATOR_TYPE=rule-based  # or 'ai' for AI-powered

# AI Service (if using AI evaluator)
OPENAI_API_KEY=sk-your-key-here
AI_MODEL=gpt-4

# Email
SMTP_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@visaeval.com

# Security
API_KEY_LENGTH=32
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Logging
LOG_LEVEL=warn
```

**Security Notes**:
- Use strong, unique passwords
- Never commit `.env` to version control
- Restrict file permissions: `chmod 600 .env`
- Use environment variable management tools (AWS Secrets Manager, HashiCorp Vault)

### Seed Database

```bash
npm run seed
```

This populates the database with initial visa type data.

### Deploy with PM2

**Create PM2 Ecosystem File**:

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'visa-api',
    script: './dist/server.js',
    instances: 2,  // Number of instances (use 'max' for all CPU cores)
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M'
  }]
}
```

**Start Application**:

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd
# Follow the instructions provided by the command

# Check status
pm2 status

# View logs
pm2 logs visa-api

# Monitor
pm2 monit
```

**PM2 Commands**:

```bash
# Restart application
pm2 restart visa-api

# Stop application
pm2 stop visa-api

# Delete from PM2
pm2 delete visa-api

# Reload (zero-downtime restart)
pm2 reload visa-api

# View detailed info
pm2 show visa-api
```

---

## Reverse Proxy Configuration

Use Nginx as a reverse proxy for:
- SSL termination
- Load balancing
- Static file serving
- Request buffering
- Security headers

### Install Nginx

```bash
sudo apt-get update
sudo apt-get install -y nginx
```

### Configure Nginx

Create site configuration:

```bash
sudo nano /etc/nginx/sites-available/visa-api
```

```nginx
upstream visa_api {
    least_conn;
    server 127.0.0.1:3000;
    # Add more servers for load balancing
    # server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    # SSL Configuration (will be configured in next section)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Logging
    access_log /var/log/nginx/visa-api-access.log;
    error_log /var/log/nginx/visa-api-error.log;
    
    # Client body size (for file uploads)
    client_max_body_size 10M;
    
    # Proxy settings
    location / {
        proxy_pass http://visa_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint (no auth required)
    location /health {
        proxy_pass http://visa_api/health;
        access_log off;
    }
}
```

**Enable Site**:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/visa-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## SSL/HTTPS Setup

### Option 1: Let's Encrypt (Free)

**Install Certbot**:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

**Obtain Certificate**:

```bash
# Obtain and install certificate
sudo certbot --nginx -d api.yourdomain.com

# Follow prompts to:
# - Enter email address
# - Agree to terms
# - Choose redirect option (recommended)
```

**Auto-Renewal**:

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
# Verify with:
sudo systemctl status certbot.timer
```

### Option 2: Commercial Certificate

If using a commercial SSL certificate:

1. **Generate CSR**:
```bash
openssl req -new -newkey rsa:2048 -nodes \
  -keyout api.yourdomain.com.key \
  -out api.yourdomain.com.csr
```

2. **Submit CSR** to certificate authority

3. **Install Certificate**:
```bash
# Copy files to secure location
sudo mkdir -p /etc/ssl/private
sudo cp api.yourdomain.com.key /etc/ssl/private/
sudo cp api.yourdomain.com.crt /etc/ssl/certs/
sudo cp ca-bundle.crt /etc/ssl/certs/

# Set permissions
sudo chmod 600 /etc/ssl/private/api.yourdomain.com.key
```

4. **Update Nginx** configuration with certificate paths

---

## Monitoring and Logging

### Application Logging

**Winston Configuration** (already implemented):

Logs are written to:
- `logs/error.log`: Error level logs
- `logs/combined.log`: All logs
- Console: In development

**Log Rotation**:

Install logrotate:

```bash
sudo nano /etc/logrotate.d/visa-api
```

```
/opt/visa-api/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 visaapi visaapi
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### PM2 Monitoring

**Built-in Monitoring**:

```bash
# Real-time monitoring
pm2 monit

# Web-based monitoring (PM2 Plus)
pm2 link <secret> <public>
```

### System Monitoring

**Install Monitoring Tools**:

```bash
# Install htop for process monitoring
sudo apt-get install -y htop

# Install netdata for comprehensive monitoring
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

**Monitor Key Metrics**:
- CPU usage
- Memory usage
- Disk I/O
- Network traffic
- MongoDB performance
- API response times

### Health Check Monitoring

**Setup Uptime Monitoring**:

Use services like:
- UptimeRobot (free tier available)
- Pingdom
- StatusCake
- AWS CloudWatch

**Configure Health Check**:
- URL: `https://api.yourdomain.com/health`
- Interval: 5 minutes
- Alert on: 3 consecutive failures

### Error Tracking

**Recommended Tools**:
- Sentry (error tracking)
- LogRocket (session replay)
- Datadog (APM)

**Sentry Integration** (example):

```bash
npm install @sentry/node
```

```typescript
// In server.ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
})

// Add to error handler
app.use(Sentry.Handlers.errorHandler())
```

---

## Backup and Recovery

### MongoDB Backup Strategy

#### Automated Backups (MongoDB Atlas)

Atlas provides:
- Continuous backups
- Point-in-time recovery
- Automated snapshots
- Cross-region replication

#### Manual Backups (Self-Hosted)

**Create Backup Script**:

```bash
nano /opt/visa-api/scripts/backup-mongodb.sh
```

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/opt/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
MONGODB_URI="mongodb://username:password@localhost:27017/visa-evaluation"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/backup_$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C "$BACKUP_DIR" "backup_$DATE"
rm -rf "$BACKUP_DIR/backup_$DATE"

# Delete backups older than 30 days
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.tar.gz"
```

**Make Executable**:

```bash
chmod +x /opt/visa-api/scripts/backup-mongodb.sh
```

**Schedule with Cron**:

```bash
crontab -e
```

```cron
# Daily backup at 2 AM
0 2 * * * /opt/visa-api/scripts/backup-mongodb.sh >> /var/log/mongodb-backup.log 2>&1
```

### File Storage Backup

**Backup Uploads Directory**:

```bash
# Sync to remote storage
rsync -avz /opt/visa-api/backend/uploads/ user@backup-server:/backups/uploads/

# Or use cloud storage
aws s3 sync /opt/visa-api/backend/uploads/ s3://your-bucket/uploads/
```

### Disaster Recovery Plan

**Recovery Steps**:

1. **Restore MongoDB**:
```bash
mongorestore --uri="mongodb://username:password@localhost:27017/visa-evaluation" /path/to/backup
```

2. **Restore Files**:
```bash
rsync -avz user@backup-server:/backups/uploads/ /opt/visa-api/backend/uploads/
```

3. **Restart Application**:
```bash
pm2 restart visa-api
```

**Test Recovery**:
- Perform quarterly disaster recovery drills
- Document recovery time objective (RTO)
- Document recovery point objective (RPO)

---

## Scaling Considerations

### Vertical Scaling

**Increase Server Resources**:
- Upgrade CPU cores
- Add more RAM
- Use faster SSD storage

**MongoDB Scaling**:
- Upgrade to larger Atlas tier
- Add more storage
- Increase IOPS

### Horizontal Scaling

**Load Balancing**:

Update Nginx configuration:

```nginx
upstream visa_api {
    least_conn;
    server 10.0.1.10:3000;
    server 10.0.1.11:3000;
    server 10.0.1.12:3000;
}
```

**Shared Storage**:

Migrate to cloud storage (S3) for file uploads:

```bash
# Install AWS SDK
npm install @aws-sdk/client-s3

# Update FileService to use S3
# See ARCHITECTURE.md for implementation details
```

**Shared Cache**:

Implement Redis for distributed caching:

```bash
# Install Redis
sudo apt-get install -y redis-server

# Install Redis client
npm install redis
```

### Database Scaling

**Read Replicas**:
- Configure MongoDB replica set
- Route read queries to replicas
- Keep writes on primary

**Sharding** (for very large datasets):
- Shard by country or date
- Requires MongoDB sharded cluster
- Recommended for 1TB+ data

---

## Troubleshooting

### Application Won't Start

**Check Logs**:
```bash
pm2 logs visa-api --lines 100
```

**Common Issues**:
- MongoDB connection failed: Check connection string
- Port already in use: Change PORT in .env
- Missing dependencies: Run `npm install`
- Build errors: Run `npm run build`

### High Memory Usage

**Check PM2 Status**:
```bash
pm2 status
pm2 monit
```

**Solutions**:
- Reduce PM2 instances
- Increase max_memory_restart in ecosystem.config.js
- Check for memory leaks
- Upgrade server RAM

### Slow Response Times

**Check**:
- MongoDB query performance
- Network latency
- AI API response times
- File upload sizes

**Solutions**:
- Add database indexes
- Implement caching
- Optimize queries
- Use CDN for static files

### SSL Certificate Issues

**Check Certificate**:
```bash
sudo certbot certificates
```

**Renew Certificate**:
```bash
sudo certbot renew
```

**Test SSL**:
```bash
openssl s_client -connect api.yourdomain.com:443
```

---

## Security Best Practices

### Server Hardening

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Configure firewall
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd

# Install fail2ban
sudo apt-get install -y fail2ban
```

### Application Security

- Keep dependencies updated: `npm audit fix`
- Use environment variables for secrets
- Implement rate limiting (future)
- Regular security audits
- Monitor for suspicious activity

---

## Deployment Checklist

Before going live:

- [ ] All environment variables configured
- [ ] MongoDB connection tested
- [ ] Application builds successfully
- [ ] PM2 configured and running
- [ ] Nginx configured with SSL
- [ ] Health check endpoint responding
- [ ] Logs rotating properly
- [ ] Backups configured and tested
- [ ] Monitoring alerts configured
- [ ] Load testing completed
- [ ] Security review passed
- [ ] Documentation updated
- [ ] Rollback plan documented

---

## Support and Maintenance

### Regular Maintenance Tasks

**Weekly**:
- Review error logs
- Check disk space
- Monitor performance metrics

**Monthly**:
- Update dependencies
- Review security advisories
- Test backup restoration
- Review and optimize database

**Quarterly**:
- Disaster recovery drill
- Security audit
- Performance optimization
- Capacity planning review

---

**Last Updated**: November 17, 2025
