# Kubernetes Deployment for Rallly

This directory contains a basic Kubernetes setup for Rallly.

## Usage

1. **Secrets:** Copy `secrets.yaml.example` to `secrets.yaml` and fill in your values (database credentials, random secrets, etc.).
   ```bash
   cp secrets.yaml.example secrets.yaml
   # Edit the file...
   kubectl apply -f secrets.yaml
   ```

2. **Database:**
   If you do not have an external Postgres, deploy the included StatefulSet:
   ```bash
   kubectl apply -f postgres.yaml
   ```

3. **Deploy Rallly:**
   ```bash
   kubectl apply -f rallly.yaml
   ```

4. **Ingress:**
   Edit `ingress.yaml` to match your domain and apply:
   ```bash
   kubectl apply -f ingress.yaml
   ```
