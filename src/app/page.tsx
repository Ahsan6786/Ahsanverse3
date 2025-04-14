'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { useState } from 'react';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <nav className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold">Web3 Blockchain App</h1>
          <ConnectButton />
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">Wallet Info</h2>
            {isConnected ? (
              <div className="space-y-4">
                <p className="text-gray-300">
                  Address: {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
                <p className="text-gray-300">
                  Balance: {balance?.formatted} {balance?.symbol}
                </p>
              </div>
            ) : (
              <p className="text-gray-400">Please connect your wallet</p>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">Blockchain Stats</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Network</span>
                <span className="text-green-400">Ethereum Mainnet</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Status</span>
                <span className="text-green-400">Connected</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-gray-800 rounded-lg p-6 shadow-xl">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">MetaMask Integration</h3>
              <p className="text-gray-300">Connect your MetaMask wallet seamlessly</p>
            </div>
            <div className="p-4 bg-gray-700 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Real-time Balance</h3>
              <p className="text-gray-300">View your wallet balance in real-time</p>
            </div>
            <div className="p-4 bg-gray-700 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Multi-chain Support</h3>
              <p className="text-gray-300">Support for Ethereum Mainnet and Sepolia</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 