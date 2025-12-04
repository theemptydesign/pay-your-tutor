# SSL/TLS Setup with cert-manager and Ingress

## Step 1: Install nginx-ingress controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.1/deploy/static/provider/cloud/deploy.yaml
```

Wait for the ingress controller to get an external IP:
```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller -w
```

## Step 2: Install cert-manager

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.15.3/cert-manager.yaml
```

Wait for cert-manager to be ready:
```bash
kubectl get pods -n cert-manager -w
```

## Step 3: Create Let's Encrypt ClusterIssuer

Save this as `k8s/cluster-issuer.yaml`:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    # Production Let's Encrypt server
    server: https://acme-v02.api.letsencrypt.org/directory
    # Email for expiration notices
    email: your-email@example.com  # CHANGE THIS
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

Apply it:
```bash
kubectl apply -f k8s/cluster-issuer.yaml
```

## Step 4: Update Service to ClusterIP

Change the service type from LoadBalancer to ClusterIP since Ingress will handle external access.

Save this as `k8s/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: tutor-tracker-service
  namespace: default
spec:
  selector:
    app: tutor-tracker
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

## Step 5: Create Ingress Resource

Save this as `k8s/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tutor-tracker-ingress
  namespace: default
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - yourdomain.com  # CHANGE THIS to your actual domain
        - www.yourdomain.com  # Optional: add www subdomain
      secretName: tutor-tracker-tls
  rules:
    - host: yourdomain.com  # CHANGE THIS
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: tutor-tracker-service
                port:
                  number: 80
    - host: www.yourdomain.com  # Optional: www subdomain rule
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

## Step 6: Apply the configuration

```bash
# Apply service changes
kubectl apply -f k8s/service.yaml

# Apply ingress
kubectl apply -f k8s/ingress.yaml
```

## Step 7: Update DNS

1. Get the external IP of the nginx-ingress controller:
   ```bash
   kubectl get svc -n ingress-nginx ingress-nginx-controller
   ```

2. In your domain's DNS settings, create an A record:
   ```
   yourdomain.com → <INGRESS-EXTERNAL-IP>
   www.yourdomain.com → <INGRESS-EXTERNAL-IP>
   ```

## Step 8: Verify certificate

After DNS propagates (can take a few minutes to hours):

```bash
# Check certificate status
kubectl get certificate -n default

# Check certificate details
kubectl describe certificate tutor-tracker-tls

# Check ingress
kubectl get ingress tutor-tracker-ingress
```

Your site should now be accessible via HTTPS at `https://yourdomain.com`

## Troubleshooting

```bash
# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager

# Check certificate request
kubectl get certificaterequest -n default

# Check challenges (ACME verification)
kubectl get challenges -n default

# Check ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

## Notes

- Let's Encrypt certificates are valid for 90 days
- cert-manager automatically renews certificates before expiration
- Let's Encrypt has rate limits (50 certificates per domain per week)
- For testing, use the staging server: `https://acme-staging-v02.api.letsencrypt.org/directory`
