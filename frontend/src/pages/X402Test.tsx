import React, { useEffect, useState } from 'react';
import { useAccount, useChainId, useSwitchChain, useWalletClient } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { x402PaymentService, type PaymentRequirement, type PaymentExecutionContext, type SupportedNetwork } from '../services/x402PaymentService';

const X402Test: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  const [currentPaymentReq, setCurrentPaymentReq] = useState<PaymentRequirement | null>(null);
  const [selectedArticle, setSelectedArticle] = useState('92');
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    network?: string;
    paymentReq?: string;
    payment?: string;
    verification?: string;
    verificationHtml?: string;
  }>({});

  // Auto-detect network (Strategy A)
  const isOnBase = chainId === base.id;
  const isOnBaseSepolia = chainId === baseSepolia.id;
  const isOnCorrectNetwork = isOnBase || isOnBaseSepolia;
  const currentNetworkName = isOnBase ? 'Base Mainnet' : isOnBaseSepolia ? 'Base Sepolia' : 'Unknown';
  const preferredNetwork: SupportedNetwork = isOnBase ? 'base' : 'base-sepolia';

  // Explorer URLs based on network
  const explorerBaseUrl = isOnBase 
    ? 'https://basescan.org' 
    : 'https://sepolia.basescan.org';

  const articles = [
    { id: '92', title: 'Test article 1', price: '$0.01' },
    { id: '93', title: 'Test article 2', price: '$0.01' },
    { id: '94', title: 'Test article 3', price: '$0.01' },
  ];

  useEffect(() => {
    if (!testResults.network) return;
    const timer = setTimeout(() => {
      setTestResults(prev => {
        const { network, ...rest } = prev;
        return rest;
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [testResults.network]);

  const switchToCorrectNetwork = async () => {
    try {
      const targetChain = isOnBase ? base : baseSepolia;
      await switchChain({ chainId: targetChain.id });
      setTestResults(prev => ({ 
        ...prev, 
        network: `✅ Switched to ${targetChain.name} successfully` 
      }));
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        network: `❌ Failed to switch: ${error.message}` 
      }));
    }
  };

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

    if (!walletClient) {
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
        evmWalletClient: walletClient,
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
        const explorerUrl = lastTxHash ? `${explorerBaseUrl}/tx/${lastTxHash}` : null;

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
        <h1> See the x402 Protocol in Action </h1>
        <p className="subtitle"> 
          <p style={{fontSize:'10px'}}>Powered by Coinbase CDP on {currentNetworkName}</p>
        </p>

        {/* Wallet Status */}
        <div className="test-section wallet-section">
          <h3>🔐 Wallet Connection</h3>
          {isConnected ? (
            <div className="success-box">
              ✅ <strong>Wallet Connected</strong><br />
              <div className="address-display">Address: {address}</div>
              <div className={`network-indicator ${isOnCorrectNetwork ? 'correct' : 'wrong '}`}>
                Network: {currentNetworkName} {isOnCorrectNetwork ? '✅' : '❌'}
                
              </div>
            </div>
          ) : (
            <div className="error-box">
              ❌ Please connect your wallet using the Connect Wallet button in the header
            </div>
          )}
          
        </div>

        {/* Network Check */}
        <div className="test-section">
          <h3>🌐 Network Verification</h3>
          <p style={{fontSize:'12px'}}>
            Current Network: {currentNetworkName} (Chain ID: {chainId})<br />
            Supported Networks: Base Mainnet ({base.id}) or Base Sepolia ({baseSepolia.id})
          </p>
          <button 
            onClick={switchToCorrectNetwork}
            disabled={!isConnected || isOnCorrectNetwork}
            className="test-button"
          >
            {isOnCorrectNetwork 
              ? `On ${currentNetworkName} ✅` 
              : `Switch to Base Network`}
          </button>
          {testResults.network && (
            <div className="result-box">{testResults.network}</div>
          )}
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
            disabled={!isConnected || !isOnCorrectNetwork}
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
            disabled={!isConnected || !isOnCorrectNetwork || !currentPaymentReq}
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
