platform-monorepo/
├── README.md
├── docs/
│   ├── architecture.md
│   ├── environments.md
│   ├── naming.md
│   └── promotion-flow.md
├── infra/
│   ├── live/
│   │   ├── aws/
│   │   │   └── dev/eu-central-1/
│   │   │       ├── networking/
│   │   │       └── eks/
│   │   └── azure/
│   │       └── dev/westeurope/
│   │           ├── networking/
│   │           └── aks/
│   └── modules/
│       ├── aws/
│       │   ├── vpc/
│       │   └── eks-cluster/
│       ├── azure/
│       │   ├── vnet/
│       │   └── aks-cluster/
│       └── common/
│           ├── naming/
│           └── tags/
├── gitops/
│   ├── bootstrap/
│   │   └── argocd/
│   ├── clusters/
│   │   ├── eks-dev-eu1/
│   │   └── aks-dev-eu1/
│   └── addons/
│       ├── ingress-nginx/
│       ├── cert-manager/
│       ├── external-secrets/
│       ├── external-dns/
│       ├── monitoring/
│       └── policies/
├── workloads/
│   ├── apps/
│   │   └── payments/
│   │       ├── base/
│   │       ├── overlays/
│   │       │   ├── env/
│   │       │   │   └── dev/
│   │       │   └── cloud/
│   │       │       ├── aws/
│   │       │       └── azure/
│   │       └── targets/
│   │           ├── aws-dev/
│   │           └── azure-dev/
│   ├── shared/
│   │   └── namespace-baseline/
│   └── promotion/
│       ├── rollout-order.yaml
│       └── update-image-tag.sh
├── app/
│   ├── frontend/
│   └── backend/
│   
├── .github/
│   └── workflows/
│       ├── terraform-plan.yml
│       ├── terraform-apply.yml
│       ├── gitops-validate.yml
│       ├── app-config-validate.yml
│       ├── app-ci.yml
│       └── promote.yml
└── scripts/
    ├── validate-all.sh
    ├── plan-infra.sh
    ├── bootstrap-argocd.sh
    └── promote.sh