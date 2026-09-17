FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY audit/ /usr/share/nginx/html/audit/
COPY demos/ /usr/share/nginx/html/demos/

EXPOSE 80