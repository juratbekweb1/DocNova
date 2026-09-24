$server = "juratbekashirboyev453@34.22.248.203"
$key = "$HOME\.ssh\id_rsa"
$archive = "$env:TEMP\project.tar.gz"

Write-Host "Compressing project..."
if (Test-Path $archive) { Remove-Item $archive }
tar --exclude=.git --exclude=node_modules --exclude=.next --exclude=prisma/pglite -czf $archive .

Write-Host "Uploading to server..."
scp -i $key -o StrictHostKeyChecking=no $archive ${server}:~/

Write-Host "Configuring server..."
$remoteCommands = @"
  sudo apt-get update -y
  sudo apt-get install -y docker.io docker-compose-v2 nginx
  sudo systemctl start docker
  sudo systemctl enable docker
  sudo usermod -aG docker `$USER
  
  mkdir -p ~/docnova-web
  tar -xzf ~/project.tar.gz -C ~/docnova-web
  cd ~/docnova-web
  
  # Remove git pull from deploy.sh since we upload manually
  sed -i 's/git pull origin main/# git pull origin main/g' deploy.sh
  
  # Ensure NEXT_PUBLIC_APP_URL is correct for production
  sed -i 's/http:\/\/localhost:3000/http:\/\/34.22.248.203/g' .env
  
  sudo bash deploy.sh
  
  # Configure Nginx
  sudo bash -c 'cat << "NGINX" > /etc/nginx/sites-available/default
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host `$host;
        proxy_cache_bypass `$http_upgrade;
    }
}
NGINX'
  sudo systemctl restart nginx
"@

ssh -i $key -o StrictHostKeyChecking=no $server $remoteCommands
