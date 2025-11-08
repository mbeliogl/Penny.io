#!/bin/bash

 

# Test CDP settle endpoint directly with curl

# This bypasses our application code to test if CDP API works

 

curl --request POST \
  --url https://api.cdp.coinbase.com/platform/v2/x402/settle \
  --header 'Authorization: Bearer eyJhbGciOiJFZERTQSIsImtpZCI6IjUzZWRhNGQ1LTMyYzAtNGY3NC1iNmVkLTQ0N2UzY2ZjZjEzMiIsInR5cCI6IkpXVCIsIm5vbmNlIjoiMWQ4ZWFkNTFjY2UxY2YxNGJiMDczZWY2ZTFlNmViN2IifQ.eyJzdWIiOiI1M2VkYTRkNS0zMmMwLTRmNzQtYjZlZC00NDdlM2NmY2YxMzIiLCJpc3MiOiJjZHAiLCJ1cmlzIjpbIlBPU1QgYXBpLmNkcC5jb2luYmFzZS5jb20vcGxhdGZvcm0vdjIveDQwMi9zZXR0bGUiXSwiaWF0IjoxNzYyNTY0Nzc2LCJuYmYiOjE3NjI1NjQ3NzYsImV4cCI6MTc2MjU2NDg5Nn0.eyJhbGciOiJFZERTQSIsImtpZCI6IjUzZWRhNGQ1LTMyYzAtNGY3NC1iNmVkLTQ0N2UzY2ZjZjEzMiIsInR5cCI6IkpXVCIsIm5vbmNlIjoiZDIzZjAwNmM0NTZkM2NkYTAxMDY0NDU3ZmEyMDE3OTgifQ.eyJzdWIiOiI1M2VkYTRkNS0zMmMwLTRmNzQtYjZlZC00NDdlM2NmY2YxMzIiLCJpc3MiOiJjZHAiLCJ1cmlzIjpbIlBPU1QgYXBpLmNkcC5jb2luYmFzZS5jb20vcGxhdGZvcm0vdjIveDQwMi9zZXR0bGUiXSwiaWF0IjoxNzYyNTY1MDA0LCJuYmYiOjE3NjI1NjUwMDQsImV4cCI6MTc2MjU2NTEyNH0.JMryAeh6Swz2ZE5C3nDz_cBV2QqMO6_XBUmQDLNibM-cMNz2jOAwmldb_eZg4pp1ULtJPKjd3MTkdVV3kfitBA' \
  --header 'Content-Type: application/json' \
  --data '{

    "x402Version": 1,

    "paymentPayload": {

      "x402Version": 1,

      "scheme": "exact",

      "network": "base",

      "payload": {

        "signature": "0xa28863e001ba66b1245e570001190237eb8f7d0510a8e8b95494f9896af9bed65337ffbb2e0d05a57808f72fdc3b84035a19099b9f5dc3f290cec199155a6c601b",

        "authorization": {

          "from": "0x25A6bd85966E9dE449cf36F7f6A033944C8bB5D8",

          "to": "0x5f58d28E603eab70CC14Df5F652050B4F7D4D222",

          "value": "50000",

          "validAfter": "1762562469",

          "validBefore": "1762563079",

          "nonce": "0x1cd55693278177832a69ad28b7ef4e3f2968dd1cd44b45395aab50cbd7775c68"

        }

      }

    },

    "paymentRequirements": {

      "scheme": "exact",

      "network": "base",

      "maxAmountRequired": "50000",

      "resource": "http://localhost:3001/api/articles/104/purchase?network=base",

      "description": "Purchase access to: KYT check",

      "mimeType": "application/json",

      "outputSchema": {

        "data": "string"

      },

      "payTo": "0x5f58d28E603eab70CC14Df5F652050B4F7D4D222",

      "maxTimeoutSeconds": 10,

      "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",

      "extra": {

        "gasLimit": "1000000",

        "name": "USDC Coin",

        "version": "2",

        "title": "Purchase: KYT check",

        "category": "content",

        "serviceName": "Penny.io Article Access",

        "serviceDescription": "Unlock full access to \"KYT check\" by 0x5f58...D222",

        "pricing": {

          "currency": "USD",

          "amount": "0.05",

          "display": "$0.05"

        }

      }

    }

  }'

 

echo ""

echo "Response received ^^^"