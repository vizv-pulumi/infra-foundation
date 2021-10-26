import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import { LocalPathProvisioner } from '@vizv/module-local-path-provisioner'
import { Metallb } from '@vizv/module-metallb'
import { IngressNginx } from '@vizv/module-ingress-nginx'
import { CertManager } from '@vizv/module-cert-manager'

export interface FoundationArgs {
  loadBalancerAddresses: pulumi.Input<string>
  ingressIp: pulumi.Input<string>
  cloudflareApiToken: pulumi.Input<string>
}

export class Foundation extends pulumi.ComponentResource {
  public readonly localPathProvisionerNamespace: k8s.core.v1.Namespace
  public readonly localPathProvisioner: LocalPathProvisioner
  public readonly metallbNamespace: k8s.core.v1.Namespace
  public readonly metallb: Metallb
  public readonly ingressNginxNamespace: k8s.core.v1.Namespace
  public readonly ingressNginx: IngressNginx
  public readonly certManagerNamespace: k8s.core.v1.Namespace
  public readonly certManager: CertManager

  constructor(
    name: string,
    args: FoundationArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super('vizv:infra:Foundation', name, {}, opts)

    this.localPathProvisionerNamespace = new k8s.core.v1.Namespace(
      'local-path-provisioner',
      {
        metadata: {
          name: 'infra-foundation-local-path-provisioner',
        },
      },
      {
        parent: this,
        protect: opts?.protect,
        dependsOn: opts?.dependsOn,
      },
    )

    this.localPathProvisioner = new LocalPathProvisioner(
      'local-path-provisioner',
      {
        namespaceName: this.localPathProvisionerNamespace.metadata.name,
        path: '/srv/containers/k0s-volumes',
        policy: 'Retain',
      },
      {
        parent: this,
        protect: opts?.protect,
        dependsOn: this.localPathProvisionerNamespace,
      },
    )

    this.metallbNamespace = new k8s.core.v1.Namespace(
      'metallb',
      {
        metadata: {
          name: 'infra-foundation-metallb',
        },
      },
      {
        parent: this,
        protect: opts?.protect,
        dependsOn: opts?.dependsOn,
      },
    )

    this.metallb = new Metallb(
      'metallb',
      {
        namespaceName: this.metallbNamespace.metadata.name,
        addresses: args.loadBalancerAddresses,
      },
      {
        parent: this,
        protect: opts?.protect,
      },
    )

    this.ingressNginxNamespace = new k8s.core.v1.Namespace(
      'ingress-nginx',
      {
        metadata: {
          name: 'infra-foundation-ingress-nginx',
        },
      },
      {
        parent: this,
        protect: opts?.protect,
        dependsOn: opts?.dependsOn,
      },
    )

    this.ingressNginx = new IngressNginx(
      'ingress-nginx',
      {
        namespaceName: this.ingressNginxNamespace.metadata.name,
        ip: args.ingressIp,
      },
      {
        parent: this,
        dependsOn: this.metallb.chart.ready,
        protect: opts?.protect,
      },
    )

    this.certManagerNamespace = new k8s.core.v1.Namespace(
      'cert-manager',
      {
        metadata: {
          name: 'infra-foundation-cert-manager',
        },
      },
      {
        parent: this,
        protect: opts?.protect,
        dependsOn: opts?.dependsOn,
      },
    )

    this.certManager = new CertManager(
      'cert-manager',
      {
        namespaceName: this.certManagerNamespace.metadata.name,
        cloudflareApiToken: args.cloudflareApiToken,
        acmeServer: 'https://acme-v02.api.letsencrypt.org/directory',
      },
      {
        parent: this,
        protect: opts?.protect,
      },
    )
  }
}
