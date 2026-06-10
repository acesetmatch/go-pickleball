FROM nginx:alpine

# Install certbot for Let's Encrypt
RUN apk add --no-cache certbot certbot-nginx

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create directories for SSL certificates
RUN mkdir -p /etc/letsencrypt/live

# Create script for SSL certificate renewal
RUN echo '#!/bin/sh\ncertbot renew --quiet' > /usr/local/bin/renew-ssl.sh && \
    chmod +x /usr/local/bin/renew-ssl.sh

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"] 