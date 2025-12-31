# VibeGames Deployment Guide

Deploy VibeGames to Coolify using Docker.

## Prerequisites

- A server with [Coolify](https://coolify.io) installed
- GitHub repository: `ruttydm/vibegames`

## Quick Deploy to Coolify

### Option 1: Nixpacks (Recommended - No Dockerfile needed)

1. **Create Application**
   - Go to Coolify Dashboard → Projects → Add New Resource → Application
   - Select your GitHub repository

2. **Configure Build Settings**
   - Build Pack: `Nixpacks`
   - Build Command: `bun run build`
   - Start Command: `node .output/server/index.mjs`

3. **Environment Variables**
   ```
   NODE_ENV=production
   HOST=0.0.0.0
   PORT=3000
   ```

4. **Deploy**
   - Click "Deploy" and Coolify handles the rest

### Option 2: Docker (Using included Dockerfile)

1. **Create Application**
   - Go to Coolify Dashboard → Projects → Add New Resource → Application
   - Select your GitHub repository

2. **Configure Build Settings**
   - Build Pack: `Dockerfile`
   - Dockerfile Location: `Dockerfile` (root)

3. **Environment Variables**
   ```
   NODE_ENV=production
   ```

4. **Port Configuration**
   - Exposed Port: `3000`

5. **Deploy**

## Configuration Details

### Nixpacks Config (Optional)

If you encounter build issues with Bun, create `nixpacks.toml`:

```toml
[phases.setup]
nixPkgs = ["...", "bun"]

[phases.install]
cmds = ["bun install --frozen-lockfile"]

[phases.build]
cmds = ["bun run build"]

[start]
cmd = "node .output/server/index.mjs"
```

### WebSocket Support

This app uses WebSockets for multiplayer games. Coolify handles WebSocket proxying automatically when using the default nginx configuration.

If you need to configure manually:
- Ensure WebSocket upgrade headers are passed through
- The WebSocket endpoint is `/_ws`

### Domain & SSL

1. In Coolify, go to your application settings
2. Add your domain under "Domains"
3. Enable "Generate SSL Certificate" for automatic HTTPS via Let's Encrypt

### Health Checks

Add to Coolify application settings:
- Health Check Path: `/`
- Health Check Port: `3000`

## Build Locally

Test the Docker build locally:

```bash
# Build
docker build -t vibegames .

# Run
docker run -p 3000:3000 vibegames

# Access at http://localhost:3000
```

## Troubleshooting

### Build Fails with Bun

If Nixpacks doesn't detect Bun correctly:
1. Use the Dockerfile option instead
2. Or add the `nixpacks.toml` configuration above

### WebSocket Connection Issues

1. Check that your reverse proxy supports WebSocket upgrades
2. Verify the `/_ws` endpoint is accessible
3. Check browser console for connection errors

### Memory Issues

For servers with limited RAM:
- Set `NODE_OPTIONS=--max-old-space-size=512` in environment variables
- Consider using swap space on the server

## Resources

- [Coolify Nuxt Docs](https://coolify.io/docs/applications/nuxt)
- [Nuxt Deployment Guide](https://nuxt.com/docs/getting-started/deployment)
- [Docker Best Practices for Nuxt](https://content.nuxt.com/docs/deploy/docker)
