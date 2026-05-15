# StockPro Frontend

This folder contains the Angular frontend for StockPro.

## Run Locally

From this folder:

```powershell
npm install
npm start
```

## Build

```powershell
npm run build
```

## Backend Connection

- Development proxy: `proxy.conf.json`
- Gateway target: `http://localhost:8082`
- Auth shortcut target: `http://localhost:8083`
- Production/nginx routing: relative `/api` requests proxied to `api-gateway:8082`

The frontend did not need import changes during the restructure because it already used relative API paths.
