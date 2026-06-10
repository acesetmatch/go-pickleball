#!/bin/bash

# SSL Setup Script for Pickleball API
# Usage: ./setup-ssl.sh your-domain.com

set -e

DOMAIN=$1
EMAIL="acesetmatch@gmail.com"  # Change this to your email

if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 <domain>"
echo "Example: $0 api.pickleball-db.com"
    exit 1
fi

echo "🔐 Setting up SSL for domain: $DOMAIN"

# Update nginx.conf with the actual domain
sed -i.bak "s/your-domain.com/$DOMAIN/g" nginx.conf

# Start services without SSL first
echo "🚀 Starting services..."
docker-compose up -d nginx

# Wait for nginx to be ready
echo "⏳ Waiting for nginx to be ready..."
sleep 10

# Get SSL certificate using Let's Encrypt
echo "📜 Obtaining SSL certificate from Let's Encrypt..."
docker exec pickleball-nginx certbot --nginx \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --domains $DOMAIN \
    --redirect

# Reload nginx with SSL configuration
echo "🔄 Reloading nginx with SSL configuration..."
docker exec pickleball-nginx nginx -s reload

echo "✅ SSL setup complete!"
echo "🌐 Your API is now available at: https://$DOMAIN"
echo "📋 Test endpoints:"
echo "   - Health: https://$DOMAIN/health"
echo "   - API: https://$DOMAIN/api/paddles"

# Setup automatic renewal
echo "🔄 Setting up automatic SSL renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * docker exec pickleball-nginx /usr/local/bin/renew-ssl.sh") | crontab -

echo "🎉 Setup complete! SSL certificate will auto-renew daily at 12 PM." 