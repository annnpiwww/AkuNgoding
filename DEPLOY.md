# 🚀 Deployment Guide - Self-Host di Proxmox dengan Tailscale

Guide ini untuk deploy AkuNgoding di Proxmox server dan akses via Tailscale (private network).

**Benefits:**
- ✅ **No timeout limits** (full control)
- ✅ **Gratis** (no domain/hosting fees)
- ✅ **Secure** (Tailscale encrypted VPN)
- ✅ **Private** (tidak exposed ke public internet)
- ✅ **Akses remote** dari mana saja via Tailscale

---

## 📋 Prerequisites

**Server Requirements:**
- Proxmox VE 7.x atau 8.x
- Minimal 2GB RAM
- Minimal 20GB storage
- Ubuntu 22.04 LTS VM atau LXC container

**Tools yang dibutuhkan:**
- Docker & Docker Compose
- Tailscale account (free tier)
- Git

---

## 🔧 Step 1: Setup VM/Container di Proxmox

### Option A: LXC Container (Recommended - lebih ringan)

```bash
# Create Ubuntu 22.04 LXC container via Proxmox UI:
# - Template: ubuntu-22.04-standard
# - RAM: 2GB
# - Storage: 20GB
# - Network: Bridge (vmbr0)
# - Start on boot: Yes

# Akses container via console atau SSH
pct enter <container-id>
```

### Option B: VM

```bash
# Create VM via Proxmox UI dengan Ubuntu 22.04 Server ISO
# Specs: 2 vCPU, 2GB RAM, 20GB storage
```

---

## 📡 Step 2: Install Tailscale

**Di Proxmox server/VM/container:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Start Tailscale dan authenticate
sudo tailscale up

# Copy Tailscale IP yang muncul (format: 100.x.x.x)
# Atau lihat dengan: tailscale ip -4
```

**Di client devices (laptop/phone):**
- Install Tailscale app
- Login dengan account yang sama
- Sekarang bisa akses server via Tailscale IP

---

## 🐳 Step 3: Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user ke docker group (agar tidak perlu sudo)
sudo usermod -aG docker $USER

# Logout dan login lagi untuk apply group changes
exit
# Login kembali

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

---

## 📦 Step 4: Clone Repository

```bash
# Install git jika belum
sudo apt install git -y

# Clone repo
cd ~
git clone https://github.com/annnpiwww/AkuNgoding.git
cd AkuNgoding
```

---

## ⚙️ Step 5: Configure Environment

```bash
# Copy environment template
cp env.production.example .env.production

# Edit dengan values sebenarnya
nano .env.production
```

**Fill dengan actual values:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://zarlpsasmbmjktvygkyf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_eJ1xz0bE-qcJDEcUDozrtA_MNo8gPV2
LLM_ENCRYPTION_KEY=692f6456288b0b44653ecb786c9bc4e8203ac0c064c7b3aee6754837e1a5a9e8
PORT=3000
NODE_ENV=production
```

Save (Ctrl+O, Enter, Ctrl+X).

---

## 🔨 Step 6: Build & Deploy

```bash
# Build Docker images
docker compose build

# Start services (detached mode)
docker compose up -d

# Check logs
docker compose logs -f
```

**Wait 1-2 menit** untuk build selesai. Logs seharusnya show:
```
akungoding-app   | Ready on http://0.0.0.0:3000
akungoding-nginx | nginx: ready
```

---

## ✅ Step 7: Verify Deployment

### Test dari server lokal:

```bash
curl http://localhost
# Seharusnya return HTML dari app
```

### Test dari Tailscale network:

```bash
# Get Tailscale IP
tailscale ip -4
# Output: 100.x.x.x
```

**Di browser (laptop/phone dengan Tailscale):**
```
http://100.x.x.x
```

Seharusnya buka dashboard AkuNgoding! 🎉

---

## 🎯 Step 8: Setup LLM Endpoint

**Di app settings (http://100.x.x.x/settings/llm):**

1. Base URL: `https://thursday-punk-colour-consolidated.trycloudflare.com/v1`
2. Model Name: `PRD`
3. API Key: `sk-23a9722ed5683fbd-816ddb-6268eeec`
4. Click "Test Connection" → seharusnya success
5. Click "Simpan & Jadikan Aktif"

**Catatan:** Cloudflare tunnel harus running di network yang sama dengan Proxmox.

---

## 🔍 Troubleshooting

### Container tidak start:

```bash
# Check logs
docker compose logs

# Check container status
docker compose ps

# Restart services
docker compose restart
```

### Port 80/443 sudah dipakai:

```bash
# Check what's using port
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting service atau ubah port di docker-compose.yml
```

### LLM endpoint timeout:

```bash
# Check Cloudflare tunnel status
# Make sure tunnel running dan reachable

# Test dari Proxmox server:
curl https://thursday-punk-colour-consolidated.trycloudflare.com/v1/models
```

### Cannot access via Tailscale:

```bash
# Check Tailscale status
sudo tailscale status

# Check firewall
sudo ufw status
# Jika enabled, allow port 80:
sudo ufw allow 80
```

---

## 🌐 Alternative: Setup Custom Domain (Optional)

Jika mau pakai domain custom (akungoding.my.id):

### 1. Buy domain dari registrar
- Niagahoster, DomaiNesia, dll.
- Domain .my.id ~Rp 15.000/tahun

### 2. Point DNS ke Proxmox public IP

```
Type: A
Name: @
Value: <public-ip-proxmox>
TTL: 3600
```

### 3. Enable SSL dengan Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d akungoding.my.id

# Auto-renewal test
sudo certbot renew --dry-run
```

### 4. Update nginx.conf untuk HTTPS

Uncomment SSL sections di `nginx.conf` dan rebuild:

```bash
docker compose down
docker compose up -d --build
```

---

## 📊 Monitoring & Maintenance

### Check logs:

```bash
# App logs
docker compose logs app -f

# Nginx logs
docker compose logs nginx -f

# All logs
docker compose logs -f
```

### Update aplikasi:

```bash
cd ~/AkuNgoding
git pull origin main
docker compose down
docker compose up -d --build
```

### Backup database:

Supabase automatically backup database. Download dari Supabase dashboard jika perlu.

---

## 🎉 Done!

Aplikasi sekarang running di:
- **Local network:** `http://192.168.x.x`
- **Tailscale network:** `http://100.x.x.x`
- **Custom domain (optional):** `http://akungoding.my.id`

**No timeout issues!** Self-host = full control, unlimited generation time.

---

## 📞 Support

Jika ada issues:
1. Check logs: `docker compose logs -f`
2. Restart services: `docker compose restart`
3. Check Tailscale: `sudo tailscale status`
4. Check GitHub issues: https://github.com/annnpiwww/AkuNgoding/issues
