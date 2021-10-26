import * as pulumi from '@pulumi/pulumi'
import * as foundation from './lib'

const config = new pulumi.Config()

const resource = new foundation.Foundation('foundation', {
  loadBalancerAddresses: config.require('loadBalancerAddresses'),
  ingressIp: config.require('ingressIp'),
  cloudflareApiToken: config.requireSecret('cloudflareApiToken'),
})

export const baseDomain = config.require('baseDomain')
export const ingressIp = config.require('ingressIp')
