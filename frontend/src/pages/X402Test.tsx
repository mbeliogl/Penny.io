import React, { useMemo, useState } from 'react';
import { useChainId, useWalletClient } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { useAppKitNetwork, useAppKitProvider, useWalletInfo } from '@reown/appkit/react';
import { x402PaymentService, type PaymentRequirement, type PaymentExecutionContext, type SupportedNetwork } from '../services/x402PaymentService';
import { useWallet } from '../contexts/WalletContext';
import { createSolanaTransactionSigner } from '../utils/solanaSigner';

const X402Test: React.FC = () => {
  const { address, isConnected } = useWallet();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { caipNetworkId, chainId: appKitChainId } = useAppKitNetwork();
  const { walletProvider: solanaWalletProvider } = useAppKitProvider('solana');
  const { walletInfo } = useWalletInfo();
  const solanaSigner = useMemo(
    () => createSolanaTransactionSigner(solanaWalletProvider),
    [solanaWalletProvider]
  );

  const [currentPaymentReq, setCurrentPaymentReq] = useState<PaymentRequirement | null>(null);
  const [selectedArticle, setSelectedArticle] = useState('92');
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    paymentReq?: string;
    payment?: string;
    verification?: string;
    verificationHtml?: string;
  }>({});

  const SUPPORTED_NETWORKS: Record<string, { label: string; supported: SupportedNetwork; family: 'evm' | 'solana'; explorerUrl: (hash: string) => string }> = {
    'eip155:8453': {
      label: 'Base Mainnet',
      supported: 'base',
      family: 'evm',
      explorerUrl: (hash: string) => `https://basescan.org/tx/${hash}`,
    },
    'eip155:84532': {
      label: 'Base Sepolia',
      supported: 'base-sepolia',
      family: 'evm',
      explorerUrl: (hash: string) => `https://sepolia.basescan.org/tx/${hash}`,
    },
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
      label: 'Solana Mainnet',
      supported: 'solana',
      family: 'solana',
      explorerUrl: (hash: string) => `https://solscan.io/tx/${hash}`,
    },
    'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1': {
      label: 'Solana Devnet',
      supported: 'solana-devnet',
      family: 'solana',
      explorerUrl: (hash: string) => `https://solscan.io/tx/${hash}?cluster=devnet`,
    },
  };

  const fallbackChainId = appKitChainId ?? chainId;
  const normalizedCaipId =
    caipNetworkId ||
    (typeof fallbackChainId === 'number' ? `eip155:${fallbackChainId}` : undefined);

  const currentNetworkInfo = normalizedCaipId
    ? SUPPORTED_NETWORKS[normalizedCaipId]
    : undefined;

  const detectedFamily: 'evm' | 'solana' | 'unknown' = normalizedCaipId
    ? normalizedCaipId.startsWith('solana:')
      ? 'solana'
      : normalizedCaipId.startsWith('eip155:')
        ? 'evm'
        : 'unknown'
    : 'unknown';

  const isSolanaNetwork = detectedFamily === 'solana';
  const isEvmNetwork = detectedFamily === 'evm';
  const currentNetworkName = currentNetworkInfo?.label
    ? currentNetworkInfo.label
    : isSolanaNetwork
      ? 'Solana Wallet'
      : isEvmNetwork && fallbackChainId
        ? `Chain ${fallbackChainId}`
        : 'Unknown';
  const preferredNetwork: SupportedNetwork = currentNetworkInfo?.supported ?? 'base';
  const isSupportedNetwork = Boolean(currentNetworkInfo);

  const explorerUrlBuilder = currentNetworkInfo?.explorerUrl;
  const networkStatusMessage = isSupportedNetwork
    ? 'Connected'
    : isSolanaNetwork
      ? 'Switch to Solana Mainnet or Devnet inside your wallet.'
      : isEvmNetwork
        ? 'Switch to Base Mainnet or Base Sepolia inside your wallet.'
        : 'Connect a supported Base or Solana network.';

  const articles = [
    { id: '92', title: 'Test article 1', price: '$0.01' },
    { id: '93', title: 'Test article 2', price: '$0.01' },
    { id: '94', title: 'Test article 3', price: '$0.01' },
  ];

  const getPaymentRequirements = async () => {
    try {
      setTestResults(prev => ({ ...prev, paymentReq: '⏳ Fetching payment requirements...' }));

      const response = await x402PaymentService.attemptPayment(
        `/articles/${selectedArticle}/purchase`,
        undefined,
        preferredNetwork
      );

      if (response.paymentRequired) {
        setCurrentPaymentReq(response.paymentRequired);

        const requirement = response.paymentRequired.accept;
        const amountDisplay = requirement
          ? `$${(parseInt(requirement.maxAmountRequired, 10) / 1_000_000).toFixed(2)} (${requirement.maxAmountRequired} micro USDC)`
          : 'Unknown';

        const prettyJson = JSON.stringify(response.paymentRequired.raw, null, 2);

        const result = `✅ Payment Requirements Received

💰 Amount: ${amountDisplay}
👤 Pay To (Author): ${requirement?.payTo}
🌐 Network: ${requirement?.network}
🪙 Asset: USDC (${requirement?.asset})
📝 Description: ${requirement?.description}

Raw Response:
${prettyJson}

Ready to execute transaction!`;

        setTestResults(prev => ({ ...prev, paymentReq: result }));
      } else if (response.success) {
        setTestResults(prev => ({ 
          ...prev, 
          paymentReq: '✅ Already paid! Access granted without new authorization.' 
        }));
      } else if (response.error) {
        setTestResults(prev => ({ ...prev, paymentReq: `❌ Error: ${response.error}` }));
      }
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, paymentReq: `❌ Error: ${error.message}` }));
    }
  };

  // Format encoded header for display (wrap every 60 chars)
  const formatEncodedHeader = (header: string | undefined): string => {
    if (!header) return 'N/A';
    const chunkSize = 60;
    const chunks: string[] = [];
    for (let i = 0; i < header.length; i += chunkSize) {
      chunks.push(header.substring(i, i + chunkSize));
    }
    return chunks.join('\n  ');
  };

  const executePayment = async () => {
    if (!address || !currentPaymentReq) {
      alert('Please connect wallet and get payment requirements first');
      return;
    }

    if (isSolanaNetwork && !solanaSigner) {
      setTestResults(prev => ({
        ...prev,
        payment: '❌ Please connect a Solana wallet to continue.',
        verificationHtml: undefined,
      }));
      return;
    }

    if (!isSolanaNetwork && !walletClient) {
      setTestResults(prev => ({ 
        ...prev, 
        payment: '❌ Wallet client unavailable. Please reconnect and retry.' ,
        verificationHtml: undefined
      }));
      return;
    }

    try {
      setTestResults(prev => ({ ...prev, payment: '⏳ Preparing x402 payment header...', verificationHtml: undefined }));

      const executionContext: PaymentExecutionContext = {
        network: preferredNetwork,
        evmWalletClient: isSolanaNetwork ? undefined : walletClient,
        solanaSigner: isSolanaNetwork ? solanaSigner : undefined,
      };

      const purchaseResult = await x402PaymentService.purchaseArticle(
        parseInt(selectedArticle, 10),
        executionContext
      );

      if (purchaseResult.success) {
        // Extract transaction hash from backend response
        const txHash = purchaseResult.rawResponse?.data?.transactionHash;
        
        // Store for verification section
        if (txHash) {
          setLastTxHash(txHash);
        }

        const formattedHeader = formatEncodedHeader(purchaseResult.encodedHeader);

        const successMsg = `🎉 PAYMENT SUCCESSFUL!

Receipt: ${purchaseResult.receipt}

Encoded Header:
  ${formattedHeader}

🔧 Settling payment via CDP facilitator...
   From: ${address}
   To: ${currentPaymentReq.to}
   Amount: ${currentPaymentReq.accept?.maxAmountRequired} micro USDC ${txHash ? `
   Transaction Hash: ${txHash}
   ` : '⚠️ Settlement succeeded but no transaction hash returned'}
✅ Settlement completed successfully!
✅ Access to article granted.`;

        setTestResults(prev => ({ ...prev, payment: successMsg }));
      } else {
        const failureDetail = purchaseResult.error || 'Payment failed';
        const raw = purchaseResult.rawResponse 
          ? `\nResponse: ${JSON.stringify(purchaseResult.rawResponse, null, 2)}` 
          : '';
        setTestResults(prev => ({ 
          ...prev, 
          payment: `❌ Payment Failed: ${failureDetail}${raw}`,
          verificationHtml: undefined 
        }));
      }
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        payment: `❌ Payment Failed: ${error.message}`,
        verificationHtml: undefined 
      }));
    }
  };

  const verifyPayment = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/payment-status/${selectedArticle}/${address}`);
      const result = await response.json();

      if (result.success && result.data.hasPaid) {
        const articleTitle = articles.find(a => a.id === selectedArticle)?.title || 'Unknown';
        const articleUrl = `${window.location.origin}/article/${selectedArticle}`;
        const explorerUrl = lastTxHash && explorerUrlBuilder
          ? explorerUrlBuilder(lastTxHash)
          : null;

        const successLines = [
          '✅ PAYMENT VERIFIED!',
          '',
          'Payment Status: PAID ✅',
          `Article: ${articleTitle}`,
          `Your Wallet: ${result.data.userAddress}`,
          '',
          `🔗 Verify Access: ${articleUrl}`,
        ];

        if (explorerUrl) {
          successLines.push(`🔗 Verify Payment: ${explorerUrl}`);
        }

        successLines.push('', `Congrats on completing your first transaction on ${currentNetworkName} 🚀`);

        const successMsg = successLines.join('\n');
        let successHtml = successMsg.replace(/\n/g, '<br />');
        successHtml = successHtml.replace(
          articleUrl,
          `<a href="${articleUrl}" target="_blank" rel="noopener noreferrer">${articleUrl}</a>`
        );

        if (explorerUrl) {
          successHtml = successHtml.replace(
            explorerUrl,
            `<a href="${explorerUrl}" target="_blank" rel="noopener noreferrer">${explorerUrl}</a>`
          );
        }

        setTestResults(prev => ({ 
          ...prev, 
          verification: successMsg,
          verificationHtml: successHtml 
        }));
      } else {
        setTestResults(prev => ({ 
          ...prev, 
          verification: '❌ Payment not found in system',
          verificationHtml: undefined 
        }));
      }
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        verification: `❌ Error: ${error.message}`,
        verificationHtml: undefined 
      }));
    }
  };

  return (
    <div className="container">
      <div className="content-wrapper">
        <h1> Article Purchase Demo </h1>
        <p className="subtitle"> 
          <p style={{fontSize:'10px'}}>x402 powered by Coinbase CDP </p>
        </p>

        {/* Wallet Status */}
        <div className="test-section">
          <h3>🔐 Wallet Connection</h3>
          {isConnected ? (
            <div className={`wallet-details ${isSupportedNetwork ? 'connected' : 'connected'}`}>
              <div className="detail-row">
                <span className="detail-label">Wallet</span>
                <span className="detail-value wallet-name-value">
                  {walletInfo?.icon && (
                    <img src={walletInfo.icon} alt={walletInfo.name} className="wallet-icon" />
                  )}
                  {walletInfo?.name || 'Connected'}
                </span>
              </div>
              <div className="detail-row wallet-address-row">
                <span className="detail-label">Address</span>
                <span className="detail-value">{address}</span>
              </div>
            </div>
          ) : (
            <div className="wallet-details disconnected">
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className="detail-value">❌ Disconnected</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Action</span>
                <span className="detail-value">Connect wallet in header</span>
              </div>
            </div>
          )}

        </div>

        {/* Network Check */}
        <div className="test-section">
          <h3>🌐 Network Configuration</h3>
          <div className={`network-details ${isSupportedNetwork ? 'supported' : 'unsupported'}`}>
            <div className="detail-row">
              <span className="detail-label">Network</span>
              <span className="detail-value">{currentNetworkName}</span>
            </div>
            <div className="detail-row type-row">
              <span className="detail-label">Type</span>
              <span className="detail-value">{isSolanaNetwork ? 'SVM' : isEvmNetwork ? 'EVM' : 'Unknown'}</span>
            </div>
            <div className="detail-row identifier-row">
              <span className="detail-label">Identifier</span>
              <span className="detail-value identifier">
                {isSolanaNetwork ? normalizedCaipId || '—' : chainId ?? '—'}
              </span>
            </div>
            <div className="detail-row status">
              <span className="detail-label">Status</span>
              <span className="detail-value">{networkStatusMessage}</span>
            </div>
          </div>
        </div>

        {/* Article Selection */}
        <div className="test-section">
          <h3>📖 Select Article to Purchase</h3>
          <div className="form-group">
            <select 
              id="articleSelect" 
              value={selectedArticle} 
              onChange={(e) => setSelectedArticle(e.target.value)}
              className="article-select"
            >
              {articles.map(article => (
                <option key={article.id} value={article.id}>
                  {article.title} ({article.price})
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={getPaymentRequirements}
            disabled={!isConnected || !isSupportedNetwork}
            className="test-button"
          >
            Get Payment Requirements
          </button>
          {testResults.paymentReq && (
            <div className="result-box">{testResults.paymentReq}</div>
          )}
        </div>

        {/* Payment Flow */}
        <div className="test-section">
          <h3>💰 x402 Payment Flow (CDP Settlement)</h3>
          <p style={{fontSize:'12px'}}>
            This will send the x402 payload (header) to your wallet for authorization.<br />
            Once confirmed, the Coinbase x402 Facilitator will automatically settle your payment on-chain (gas-free).
          </p>
          <button 
            onClick={executePayment}
            disabled={
              !isConnected ||
              !isSupportedNetwork ||
              !currentPaymentReq ||
              (isSolanaNetwork && !solanaSigner) ||
              (!isSolanaNetwork && !walletClient)
            }
            className="test-button payment-button"
          >
            Execute Transaction
          </button>
          {testResults.payment && (
            <div className="result-box">{testResults.payment}</div>
          )}
        </div>

        {/* Verification */}
        <div className="test-section">
          <h3>✅ Transaction Proof</h3>
          <p style={{fontSize:'12px'}}>Check that payment was executed on-chain and you now have access to the article.</p>
          <button 
            onClick={verifyPayment}
            disabled={!isConnected || !address}
            className="test-button"
          >
            Verify Transaction
          </button>
          {testResults.verificationHtml ? (
            <div
              className="result-box"
              dangerouslySetInnerHTML={{ __html: testResults.verificationHtml }}
            />
          ) : testResults.verification ? (
            <div className="result-box">{testResults.verification}</div>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }

        .content-wrapper {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 20px rgba(0,0,0,0.1);
        }

        h1 {
          color: #1a1a1a;
          margin-bottom: 10px;
        }

        .subtitle {
          color: #666;
          margin-bottom: 30px;
        }

        .test-section {
          margin: 20px 0;
          padding: 20px;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          background: #f8f9fa;
        }

        .wallet-section {
          background: #e3f2fd;
          border: 1px solid #90caf9;
        }

        .test-section h3 {
          margin-top: 0;
          color: #1a1a1a;
        }

        .test-button {
          background: #1a1a1a;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          margin: 5px 0;
        }

        .test-button:hover:not(:disabled) {
          background: #2a2a2a;
        }

        .test-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .payment-button {
          background: #0052FF;
        }

        .payment-button:hover:not(:disabled) {
          background: #0041CC;
        }

        .success-box {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
          padding: 15px;
          border-radius: 6px;
        }

        .error-box {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 15px;
          border-radius: 6px;
        }

        .network-details {
          margin-top: 12px;
          border-radius: 12px;
          border: 1px solid #dfe5ef;
          background: white;
          padding: 16px 22px;
          display: grid;
          grid-template-columns: minmax(140px, 0.8fr) minmax(120px, 0.6fr) minmax(280px, 1.6fr);
          gap: 14px 20px;
        }

        .network-details.supported {
          border-color: #8bd0af;
          box-shadow: 0 0 0 2px rgba(139, 208, 175, 0.15);
        }

        .network-details.unsupported {
          border-color: #f4a6a1;
          box-shadow: 0 0 0 2px rgba(244, 166, 161, 0.12);
        }

        .detail-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: left;
        }

        .detail-row.status {
          grid-column: 1 / -1;
          padding-top: 8px;
          border-top: 1px dashed #eceff3;
        }

        .type-row {
          max-width: 180px;
          margin: 0 auto;
        }

        .detail-row.identifier-row {
          word-break: break-word;
          text-align: center;
        }

        .detail-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #5f6c7b;
        }

        .detail-value {
          font-size: 14px;
          font-weight: 600;
          color: #1c1f24;
        }

        .detail-value.identifier {
          word-break: break-word;
          text-align: center;
        }

        .wallet-details {
          margin-top: 12px;
          border-radius: 12px;
          border: 1px solid #dfe5ef;
          background: white;
          padding: 16px 22px;
          display: grid;
          grid-template-columns: minmax(140px, 0.8fr) minmax(280px, 1.6fr);
          gap: 14px 20px;
        }

        .wallet-details.connected {
          border-color: #8bd0af;
          box-shadow: 0 0 0 2px rgba(139, 208, 175, 0.15);
        }

        .wallet-details.disconnected {
          border-color: #f4a6a1;
          box-shadow: 0 0 0 2px rgba(244, 166, 161, 0.12);
        }

        .wallet-address-row .detail-value {
          word-break: break-all;
          font-family: monospace;
          font-size: 13px;
        }

        .wallet-name-value {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .wallet-icon {
          width: 20px;
          height: 20px;
          border-radius: 4px;
        }

        @media (max-width: 700px) {
          .network-details {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          }

          .wallet-details {
            grid-template-columns: 1fr;
          }
        }

        .result-box {
          margin-top: 15px;
          padding: 15px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 12px;
          white-space: pre-wrap;
          overflow-x: auto;
          background: #d1ecf1;
          border: 1px solid #bee5eb;
          color: #0c5460;
        }

        .address-display {
          font-family: monospace;
          background: #f8f9fa;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ddd;
          word-break: break-all;
          margin: 8px 0;
        }

        .network-indicator {
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          display: inline-block;
          margin: 5px 0;
          color: white;
        }

        .network-indicator.correct {
          background: #28a745;
        }

        .network-indicator.wrong {
          background: #dc3545;
        }

        .form-group {
          margin: 15px 0;
        }

        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #333;
        }

        .article-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin: 5px 0;
        }
      `}</style>
    </div>
  );
};

export default X402Test;
