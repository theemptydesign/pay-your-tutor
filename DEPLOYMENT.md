# Deployment Guide: Pay Your Tutor on Linode LKE

This guide walks you through deploying the Pay Your Tutor application to Linode Kubernetes Engine (LKE) using GitHub Actions.

## Prerequisites

1. **Linode Account** with an LKE cluster created
2. **GitHub repository** for this project
3. **PostgreSQL Database** (Linode Managed Database recommended)
4. **kubectl** installed locally (for initial setup)
5. **Linode CLI** installed (optional, for managing resources)

## Step 1: Set Up Your Linode LKE Cluster

### Create an LKE Cluster

1. Log in to [Linode Cloud Manager](https://cloud.linode.com)
2. Navigate to **Kubernetes** ’ **Create Cluster**
3. Configure your cluster:
   - **Cluster Label**: `tutor-tracker-cluster`
   - **Region**: Choose closest to your users
   - **Kubernetes Version**: Latest stable version
   - **Node Pools**: Add at least 2 nodes (e.g., Linode 4GB instances)
4. Click **Create Cluster**

### Download Kubeconfig

1. Once cluster is ready, click on it in the dashboard
2. Download the kubeconfig file (top right corner)
3. Test connection locally:
   ```bash
   export KUBECONFIG=/path/to/downloaded-kubeconfig.yaml
   kubectl get nodes
   ```

## Step 2: Set Up PostgreSQL Database

### Option A: Linode Managed Database (Recommended)

1. In Linode Cloud Manager, go to **Databases** ’ **Create Database**
2. Configure:
   - **Database Engine**: PostgreSQL 17
   - **Label**: `tutor-tracker-db`
   - **Region**: Same as your LKE cluster
   - **Plan**: Start with 1GB RAM plan
3. Create the database named `tutor_tracker`
4. Note the connection string in format:
   ```
   postgresql://username:password@host:port/tutor_tracker?sslmode=require
   ```

### Option B: Self-Hosted PostgreSQL in Kubernetes

If you prefer running PostgreSQL in your cluster, you'll need to create separate Kubernetes manifests for a PostgreSQL StatefulSet with persistent volumes.

## Step 3: Configure GitHub Secrets

Navigate to your GitHub repository ’ **Settings** ’ **Secrets and variables** ’ **Actions**

Add the following **Repository Secrets**:

### 1. KUBECONFIG

The base64-encoded kubeconfig file for your LKE cluster.

```bash
# Encode your kubeconfig
cat /path/to/downloaded-kubeconfig.yaml | base64 | tr -d '\n'
```

Copy the output and create a secret named `KUBECONFIG` with this value.

### 2. DATABASE_URL

Your PostgreSQL connection string:

```
postgresql://username:password@host:port/tutor_tracker?sslmode=require
```

**Important**: Replace with your actual database credentials.

## Step 4: Update Kubernetes Manifests

### Update k8s/deployment.yaml

The workflow will automatically update the image, but verify these settings:

```yaml
spec:
  replicas: 2  # Adjust based on your needs
  template:
    spec:
      containers:
        - name: tutor-tracker
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
```

### Service Configuration

The deployment uses a LoadBalancer service. Linode will automatically provision a NodeBalancer.

To find your external IP after deployment:
```bash
kubectl get svc tutor-tracker-service
```

## Step 5: Initial Deployment

### Manual First Deployment (Optional)

Before relying on GitHub Actions, you can manually deploy:

```bash
# Set your kubeconfig
export KUBECONFIG=/path/to/kubeconfig.yaml

# Create the namespace (if needed)
kubectl create namespace default

# Create the database secret
kubectl create secret generic tutor-tracker-secrets \
  --from-literal=DATABASE_URL="postgresql://user:pass@host:port/tutor_tracker?sslmode=require"

# Build and push the Docker image manually
docker build -t ghcr.io/your-username/pay-your-tutor:latest .
docker push ghcr.io/your-username/pay-your-tutor:latest

# Update deployment.yaml with your image
# Then apply
kubectl apply -f k8s/deployment.yaml

# Check status
kubectl get pods
kubectl get svc
```

### Automated Deployment via GitHub Actions

Once secrets are configured, simply push to main:

```bash
git add .
git commit -m "Deploy to LKE"
git push origin main
```

The GitHub Actions workflow will:
1. Build the Docker image
2. Push to GitHub Container Registry (ghcr.io)
3. Connect to your LKE cluster
4. Update the database secret
5. Deploy the new image
6. Run database migrations
7. Wait for rollout to complete

## Step 6: Verify Deployment

### Check GitHub Actions

1. Go to your repository ’ **Actions** tab
2. Watch the workflow run
3. Check for any errors in the logs

### Check Kubernetes Resources

```bash
# Check pods
kubectl get pods -l app=tutor-tracker

# Check service and get external IP
kubectl get svc tutor-tracker-service

# Check logs
kubectl logs -l app=tutor-tracker --tail=100

# Describe pod for detailed info
kubectl describe pod <pod-name>
```

### Access Your Application

Once the service shows an EXTERNAL-IP:

```bash
kubectl get svc tutor-tracker-service
```

Access your app at `http://<EXTERNAL-IP>`

## Step 7: Set Up Custom Domain (Optional)

### Using Linode's NodeBalancer

1. Note your NodeBalancer's external IP
2. In your DNS provider, create an A record:
   ```
   tutor-tracker.yourdomain.com ’ <EXTERNAL-IP>
   ```

### Using Ingress with TLS (Recommended for Production)

Install cert-manager and nginx-ingress:

```bash
# Install nginx-ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

Create an Ingress resource in `k8s/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tutor-tracker-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - tutor-tracker.yourdomain.com
      secretName: tutor-tracker-tls
  rules:
    - host: tutor-tracker.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: tutor-tracker-service
                port:
                  number: 80
```

## Step 8: Database Migrations

Migrations run automatically in the GitHub Actions workflow. To run manually:

```bash
# Get a pod name
POD=$(kubectl get pod -l app=tutor-tracker -o jsonpath="{.items[0].metadata.name}")

# Run migrations
kubectl exec $POD -- npx drizzle-kit push

# Or get a shell
kubectl exec -it $POD -- sh
npx drizzle-kit push
```

## Monitoring and Troubleshooting

### View Logs

```bash
# Stream logs from all pods
kubectl logs -f -l app=tutor-tracker

# Logs from specific pod
kubectl logs <pod-name>

# Previous container logs (if crashed)
kubectl logs <pod-name> --previous
```

### Common Issues

**Pods not starting**
```bash
kubectl describe pod <pod-name>
kubectl get events --sort-by='.lastTimestamp'
```

**Database connection issues**
- Verify DATABASE_URL secret is correct
- Check if database allows connections from your cluster IPs
- For Linode Managed DB, ensure SSL mode is enabled

**Image pull errors**
- Ensure GitHub Container Registry permissions are set to public, or
- Create an imagePullSecret for private images

### Scaling

```bash
# Scale up/down
kubectl scale deployment tutor-tracker --replicas=3

# Or edit deployment.yaml and apply
```

### Update Environment Variables

```bash
# Update secret
kubectl create secret generic tutor-tracker-secrets \
  --from-literal=DATABASE_URL="new-connection-string" \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart pods to pick up changes
kubectl rollout restart deployment/tutor-tracker
```

## Production Checklist

- [ ] Set up database backups (Linode Managed DB does this automatically)
- [ ] Configure resource limits and requests appropriately
- [ ] Set up monitoring (Prometheus/Grafana or Linode Cloud Manager metrics)
- [ ] Enable SSL/TLS with cert-manager
- [ ] Set up a custom domain
- [ ] Configure horizontal pod autoscaling if needed
- [ ] Review security: Network Policies, RBAC, Pod Security Standards
- [ ] Set up log aggregation (ELK, Loki, or Linode's log shipping)
- [ ] Configure alerts for downtime
- [ ] Document runbooks for common operations

## Cost Optimization

- Start with smaller node pools and scale up as needed
- Use Linode's 1GB or 2GB plans for development
- Monitor resource usage with `kubectl top nodes` and `kubectl top pods`
- Consider using node autoscaling for variable workloads

## Support

- Linode Docs: https://www.linode.com/docs/kubernetes/
- kubectl Docs: https://kubernetes.io/docs/reference/kubectl/
- GitHub Actions: https://docs.github.com/en/actions

## Useful Commands

```bash
# Get cluster info
kubectl cluster-info

# Get all resources
kubectl get all

# Port forward to access locally
kubectl port-forward svc/tutor-tracker-service 3000:80

# Execute command in pod
kubectl exec -it <pod-name> -- /bin/sh

# Copy files from pod
kubectl cp <pod-name>:/app/some-file ./local-file

# Watch pod status
kubectl get pods -w

# Rollback deployment
kubectl rollout undo deployment/tutor-tracker

# Check rollout history
kubectl rollout history deployment/tutor-tracker
```
