import namehash from 'eth-ens-namehash';
import Eth from 'ethjs-query';
import EthContract from 'ethjs-contract';
import ensNetworkMap from 'ethereum-ens-network-map';
import contentHash from 'content-hash';
import registryAbi from './contracts/registry';
import resolverAbi from './contracts/resolver';

export default async function resolveEnsToIpfsContentId({ provider, name }) {
  const eth = new Eth(provider);
  const hash = namehash.hash(name);
  const contract = new EthContract(eth);
  // lookup registry
  const chainId = Number.parseInt(await eth.net_version(), 10);
  const registryAddress = getRegistryForChainId(chainId);
  if (!registryAddress) {
    throw new Error(
      `EnsIpfsResolver - no known ens-ipfs registry for chainId "${chainId}"`,
    );
  }
  const Registry = contract(registryAbi).at(registryAddress);
  // lookup resolver
  const resolverLookupResult = await Registry.resolver(hash);
  const resolverAddress = resolverLookupResult[0];
  if (hexValueIsEmpty(resolverAddress)) {
    throw new Error(`EnsIpfsResolver - no resolver found for name "${name}"`);
  }
  const Resolver = contract(resolverAbi).at(resolverAddress);

  const isEIP1577Compliant = await Resolver.supportsInterface('0xbc1c58d1');
  const isLegacyResolver = await Resolver.supportsInterface('0xd8389dc5');
  if (isEIP1577Compliant[0]) {
    const contentLookupResult = await Resolver.contenthash(hash);
    const rawContentHash = contentLookupResult[0];
    let decodedContentHash = contentHash.decode(rawContentHash);
    const type = contentHash.getCodec(rawContentHash);

    if (type === 'ipfs-ns' || type === 'ipns-ns') {
      decodedContentHash =
        contentHash.helpers.cidV0ToV1Base32(decodedContentHash);
    }

    return { type, hash: decodedContentHash };
  }
  if (isLegacyResolver[0]) {
    // lookup content id
    const contentLookupResult = await Resolver.content(hash);
    const content = contentLookupResult[0];
    if (hexValueIsEmpty(content)) {
      throw new Error(
        `EnsIpfsResolver - no content ID found for name "${name}"`,
      );
    }
    return { type: 'swarm-ns', hash: content.slice(2) };
  }
  throw new Error(
    `EnsIpfsResolver - the resolver for name "${name}" is not standard, it should either supports contenthash() or content()`,
  );
}

function hexValueIsEmpty(value) {
  return [
    undefined,
    null,
    '0x',
    '0x0',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
  ].includes(value);
}

/**
 * Returns the registry address for the given chain ID
 * @param {number} networkId the base-10 chain ID as a string
 * @returns {string|null} the registry address if known, null otherwise
 */
function getRegistryForChainId(networkId) {
  return ensNetworkMap[networkId?.toString()] ?? null;
}
