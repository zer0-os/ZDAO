/* global ethers */

import { ethers } from "ethers"

export const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

interface Selectors {
  [position: number]: string
  contract: ethers.Contract;
  remove: (functionNames: string[]) => Selectors;
  get: (functionNames: string[]) => Selectors;
}

function createSelectors(functionSelectors: string[], contract: ethers.Contract): Selectors {
  const selectors: Selectors = [] as string[] as unknown as Selectors;
  selectors.contract = contract;
  selectors.get = (functionNames: string[]) => {
    const filteredSelectors = functionSelectors.filter((v) => {
      for (const functionName of functionNames) {
        if (v === contract.interface.getSighash(functionName)) {
          return true
        }
      }
      return false
    })
    return createSelectors(filteredSelectors, contract);
  }
  selectors.remove = (functionNames: string[]) => {
    const filteredSelectors = functionSelectors.filter((v) => {
      for (const functionName of functionNames) {
        if (v === contract.interface.getSighash(functionName)) {
          return false
        }
      }
      return true
    })
    return createSelectors(filteredSelectors, contract);
  }

  for (let i = 0; i < functionSelectors.length; ++i) {
    selectors[i] = functionSelectors[i];
  }

  return selectors;
}

// get function selectors from ABI
export function getSelectors(contract: ethers.Contract): Selectors {
  const signatures = Object.keys(contract.interface.functions)
  const selectors = signatures.reduce((acc: string[], val: string) => {
    if (val !== 'init(bytes)') {
      acc.push(contract.interface.getSighash(val))
    }
    return acc
  }, [])
  return createSelectors(selectors, contract);
}

// get function selector from function signature
export function getSelector(func: string) {
  const abiInterface = new ethers.utils.Interface([func])
  return abiInterface.getSighash(ethers.utils.Fragment.from(func))
}

// remove selectors using an array of signatures
export function removeSelectors(selectors: string[], signatures: string[]) {
  const iface = new ethers.utils.Interface(signatures.map(v => 'function ' + v))
  const removeSelectors = signatures.map(v => iface.getSighash(v))
  selectors = selectors.filter(v => !removeSelectors.includes(v))
  return selectors
}

// find a particular address position in the return value of diamondLoupeFacet.facets()
export function findAddressPositionInFacets(facetAddress: string, facets: { facetAddress: string }[]) {
  for (let i = 0; i < facets.length; i++) {
    if (facets[i].facetAddress === facetAddress) {
      return i
    }
  }
}
