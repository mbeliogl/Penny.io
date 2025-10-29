import React, { useState, useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useSignMessage } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

const X402Test: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { signMessage } = useSignMessage();
  
  const [currentPaymentReq, setCurrentPaymentReq] = useState<any>(null);
  const [selectedArticle, setSelectedArticle] = useState('2');
  const [testResults, setTestResults] = useState<{
    network?: string;
    paymentReq?: string;
    payment?: string;
    verification?: string;
  }>({});

  const isOnBaseSepolia = chainId === baseSepolia.id;

  const articles = [
    { id: '2', title: 'Building Scalable Web3 Applications', price: '$0.12' },
    { id: '3', title: 'The effects of gravity on buttholes', price: '$0.05' },
    { id: '4', title: 'Test article #1', price: '$0.75' },
    { id: '5', title: 'Test article #3', price: '$0.55' },
    { id: '6', title: 'J IS GAE - update #1', price: '$0.05' },
  ];

  const switchToBaseSepolia = async () => {
    try {
      await switchChain({ chainId: baseSepolia.id });
      setTestResults(prev => ({ ...prev, network: '✅ Switched to Base Sepolia successfully' }));
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, network: `❌ Failed to switch: ${error.message}` }));
    }
  };

  const getPaymentRequirements = async () => {
    try {
      setTestResults(prev => ({ ...prev, paymentReq: '⏳ Fetching payment requirements...' }));
      
      const response = await fetch(`http://localhost:3001/api/articles/${selectedArticle}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.status === 402) {
        const paymentData = await response.json();
        const req = paymentData.accepts[0];
        setCurrentPaymentReq(req);
        
        const result = `✅ Payment Requirements Received

💰 Amount: $${(parseInt(req.maxAmountRequired) / 100000).toFixed(2)} (${req.maxAmountRequired} micro USDC)
👤 Pay To (Author): ${req.payTo}
🌐 Network: ${req.network}
🪙 Asset: USDC (${req.asset})
📝 Description: ${req.description}

Ready for real wallet transaction!`;

        setTestResults(prev => ({ ...prev, paymentReq: result }));
      } else {
        throw new Error(`Unexpected response: ${response.status}`);
      }
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, paymentReq: `❌ Error: ${error.message}` }));
    }
  };

  const executePayment = async () => {
    if (!address || !currentPaymentReq) {
      alert('Please connect wallet and get payment requirements first');
      return;
    }

    try {
      setTestResults(prev => ({ ...prev, payment: '⏳ Creating payment authorization...' }));

      // Create payment authorization
      const now = Math.floor(Date.now() / 1000);
      const authorization = {
        from: address,
        to: currentPaymentReq.payTo,
        value: currentPaymentReq.maxAmountRequired,
        validAfter: now,
        validBefore: now + 300, // 5 minutes
        nonce: Math.random().toString(36).substring(2, 15)
      };

      // Create message to sign
      const message = `Authorize payment of ${authorization.value} micro USDC from ${authorization.from} to ${authorization.to} (valid ${authorization.validAfter}-${authorization.validBefore}, nonce: ${authorization.nonce})`;

      setTestResults(prev => ({ ...prev, payment: `⏳ Requesting wallet signature...\n\nMessage to sign:\n${message}` }));

      // Request signature from wallet
      const signature = await signMessage({ message });

      setTestResults(prev => ({ ...prev, payment: '⏳ Signature received, submitting payment...' }));

      // Create payment payload
      const paymentPayload = {
        signature: signature,
        authorization: authorization
      };

      // Submit payment to server
      const paymentHeader = btoa(JSON.stringify(paymentPayload));

      const response = await fetch(`http://localhost:3001/api/articles/${selectedArticle}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PAYMENT': paymentHeader
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const successMsg = `🎉 REAL PAYMENT SUCCESSFUL!

${result.data.message}
Receipt: ${result.data.receipt}

✅ Real wallet signature: ${signature.substring(0, 20)}...
✅ Payment verified and recorded
✅ USDC payment authorized to author: ${authorization.to}
✅ Access granted to full content

🎊 Complete x402 micropayment with real wallets!`;

        setTestResults(prev => ({ ...prev, payment: successMsg }));
      } else {
        throw new Error(result.error || 'Payment failed');
      }

    } catch (error: any) {
      setTestResults(prev => ({ ...prev, payment: `❌ Payment Failed: ${error.message}` }));
    }
  };

  const verifyPayment = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/payment-status/${selectedArticle}/${address}`);
      const result = await response.json();

      if (result.success && result.data.hasPaid) {
        const successMsg = `✅ PAYMENT VERIFIED!

Payment Status: PAID ✅
Article ID: ${result.data.articleId}
Your Wallet: ${result.data.userAddress}

🎊 You now have permanent access to this article!
The payment has been recorded and will persist across sessions.

Complete Real x402 + Base Sepolia + Real Wallets SUCCESS! 🚀`;

        setTestResults(prev => ({ ...prev, verification: successMsg }));
      } else {
        setTestResults(prev => ({ ...prev, verification: '❌ Payment not found in system' }));
      }
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, verification: `❌ Error: ${error.message}` }));
    }
  };

  return (
    <div className="container">
      <div className="content-wrapper">
        <h1>🪙 x402 Payment Protocol Test</h1>
        <p className="subtitle">Test real micropayments with your connected wallet on Base Sepolia</p>

        {/* Wallet Status */}
        <div className="test-section wallet-section">
          <h3>🔐 Wallet Connection</h3>
          {isConnected ? (
            <div className="success-box">
              ✅ <strong>Wallet Connected</strong><br />
              <div className="address-display">Address: {address}</div>
              <div className={`network-indicator ${isOnBaseSepolia ? 'correct' : 'wrong'}`}>
                Network: {isOnBaseSepolia ? 'Base Sepolia ✅' : 'Wrong Network ❌'}
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
          <p>Ensure you're on Base Sepolia testnet (Chain ID: {baseSepolia.id})</p>
          <button 
            onClick={switchToBaseSepolia}
            disabled={!isConnected || isOnBaseSepolia}
            className="test-button"
          >
            {isOnBaseSepolia ? 'On Base Sepolia ✅' : 'Switch to Base Sepolia'}
          </button>
          {testResults.network && (
            <div className="result-box">{testResults.network}</div>
          )}
        </div>

        {/* Article Selection */}
        <div className="test-section">
          <h3>📖 Select Article to Purchase</h3>
          <div className="form-group">
            <label htmlFor="articleSelect">Article:</label>
            <select 
              id="articleSelect" 
              value={selectedArticle} 
              onChange={(e) => setSelectedArticle(e.target.value)}
              className="article-select"
            >
              {articles.map(article => (
                <option key={article.id} value={article.id}>
                  Article #{article.id} - {article.title} ({article.price})
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={getPaymentRequirements}
            disabled={!isConnected || !isOnBaseSepolia}
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
          <h3>💰 x402 Payment Flow</h3>
          <p>This will use your real wallet to sign the payment authorization</p>
          <button 
            onClick={executePayment}
            disabled={!isConnected || !isOnBaseSepolia || !currentPaymentReq}
            className="test-button payment-button"
          >
            Execute Real Payment
          </button>
          {testResults.payment && (
            <div className="result-box">{testResults.payment}</div>
          )}
        </div>

        {/* Verification */}
        <div className="test-section">
          <h3>✅ Verify Payment & Access</h3>
          <button 
            onClick={verifyPayment}
            disabled={!isConnected || !address}
            className="test-button"
          >
            Verify Payment Status
          </button>
          {testResults.verification && (
            <div className="result-box">{testResults.verification}</div>
          )}
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