// This file contains definitions for nonlinear modules that can be added to the system

export const nonlinearModules = [
  {
    id: "nonlinear-1",
    name: "Logistic Growth Model",
    description: "Models growth with carrying capacity constraints using logistic function",
    workflowName: "Market Analysis",
    inputs: [
      { name: "initialPopulation", type: "number", value: 1000, unit: "units" },
      { name: "growthRate", type: "number", value: 0.1, unit: "rate" },
      { name: "carryingCapacity", type: "number", value: 10000, unit: "units" },
      { name: "timeSteps", type: "number", value: 50, unit: "periods" },
    ],
    outputs: [
      { name: "finalPopulation", type: "number", value: 9502, unit: "units" },
      { name: "timeToHalfCapacity", type: "number", value: 23, unit: "periods" },
    ],
    code: `function logisticGrowth(initialPopulation, growthRate, carryingCapacity, timeSteps) {
  let population = initialPopulation;
  let populations = [initialPopulation];
  let halfCapacityTime = null;
  
  for (let t = 1; t <= timeSteps; t++) {
    // Logistic growth equation: dP/dt = rP(1-P/K)
    population = population + growthRate * population * (1 - population / carryingCapacity);
    populations.push(population);
    
    // Find when population first exceeds half carrying capacity
    if (halfCapacityTime === null && population >= carryingCapacity / 2) {
      halfCapacityTime = t;
    }
  }
  
  return {
    finalPopulation: population,
    timeToHalfCapacity: halfCapacityTime,
    populationOverTime: populations
  };
}`,
    explanation:
      "This module implements the logistic growth model, which is a common model for population growth with limited resources. The growth rate slows as the population approaches the carrying capacity. The equation is dP/dt = rP(1-P/K), where P is population, r is growth rate, and K is carrying capacity.",
  },
  {
    id: "nonlinear-2",
    name: "Bass Diffusion Model",
    description: "Models adoption of new products or technologies",
    workflowName: "Market Analysis",
    inputs: [
      { name: "marketSize", type: "number", value: 100000, unit: "customers" },
      { name: "innovationCoefficient", type: "number", value: 0.03, unit: "p" },
      { name: "imitationCoefficient", type: "number", value: 0.38, unit: "q" },
      { name: "timeHorizon", type: "number", value: 20, unit: "periods" },
    ],
    outputs: [
      { name: "peakAdoptionTime", type: "number", value: 6, unit: "period" },
      { name: "peakAdoptionRate", type: "number", value: 9876, unit: "customers/period" },
      { name: "cumulativeAdopters", type: "number", value: 95423, unit: "customers" },
    ],
    code: `function bassDiffusion(marketSize, innovationCoefficient, imitationCoefficient, timeHorizon) {
  // p = innovation coefficient (external influence)
  // q = imitation coefficient (internal influence)
  // m = market size
  const p = innovationCoefficient;
  const q = imitationCoefficient;
  const m = marketSize;
  
  let adopters = [0];
  let newAdopters = [0];
  let peakAdoptionRate = 0;
  let peakAdoptionTime = 0;
  
  for (let t = 1; t <= timeHorizon; t++) {
    // Bass model equation: n(t) = p * (m - N(t-1)) + q * N(t-1)/m * (m - N(t-1))
    // where n(t) is new adopters at time t, N(t-1) is cumulative adopters at t-1
    const prevCumulative = adopters[t-1];
    const newAdoptersAtT = p * (m - prevCumulative) + q * prevCumulative / m * (m - prevCumulative);
    
    newAdopters.push(newAdoptersAtT);
    adopters.push(prevCumulative + newAdoptersAtT);
    
    // Track peak adoption
    if (newAdoptersAtT > peakAdoptionRate) {
      peakAdoptionRate = newAdoptersAtT;
      peakAdoptionTime = t;
    }
  }
  
  return {
    peakAdoptionTime: peakAdoptionTime,
    peakAdoptionRate: peakAdoptionRate,
    cumulativeAdopters: adopters[timeHorizon],
    adoptionCurve: newAdopters,
    cumulativeCurve: adopters
  };
}`,
    explanation:
      "The Bass Diffusion Model predicts how new products or technologies are adopted in a market. It accounts for two types of adopters: innovators (influenced by external factors) and imitators (influenced by existing adopters). The model produces the classic S-curve of adoption and can predict when peak adoption will occur.",
  },
  {
    id: "nonlinear-3",
    name: "Black-Scholes Option Pricing",
    description: "Calculates theoretical price of European options using Black-Scholes formula",
    workflowName: "Financial Forecast",
    inputs: [
      { name: "stockPrice", type: "number", value: 100, unit: "USD" },
      { name: "strikePrice", type: "number", value: 100, unit: "USD" },
      { name: "timeToMaturity", type: "number", value: 1, unit: "years" },
      { name: "riskFreeRate", type: "number", value: 0.05, unit: "rate" },
      { name: "volatility", type: "number", value: 0.2, unit: "sigma" },
    ],
    outputs: [
      { name: "callOptionPrice", type: "number", value: 10.45, unit: "USD" },
      { name: "putOptionPrice", type: "number", value: 5.57, unit: "USD" },
      { name: "delta", type: "number", value: 0.64, unit: "ratio" },
    ],
    code: `function blackScholes(stockPrice, strikePrice, timeToMaturity, riskFreeRate, volatility) {
  // Standard normal cumulative distribution function
  function normalCDF(x) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    
    const t = 1 / (1 + p * x);
    const erf = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return 0.5 * (1 + sign * erf);
  }
  
  const S = stockPrice;
  const K = strikePrice;
  const T = timeToMaturity;
  const r = riskFreeRate;
  const sigma = volatility;
  
  // Calculate d1 and d2
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  
  // Calculate call and put option prices
  const callPrice = S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
  const putPrice = K * Math.exp(-r * T) * normalCDF(-d2) - S * normalCDF(-d1);
  
  // Calculate delta (sensitivity of option price to changes in underlying asset price)
  const delta = normalCDF(d1);
  
  return {
    callOptionPrice: callPrice,
    putOptionPrice: putPrice,
    delta: delta,
    gamma: Math.exp(-d1 * d1 / 2) / (S * sigma * Math.sqrt(2 * Math.PI * T)),
    vega: S * Math.sqrt(T) * Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI)
  };
}`,
    explanation:
      "The Black-Scholes model is a mathematical model for pricing European-style options. It assumes that the price of the underlying asset follows a geometric Brownian motion with constant drift and volatility. The formula calculates the theoretical price of European call and put options, as well as various 'Greeks' that measure sensitivity to different factors.",
  },
  {
    id: "nonlinear-4",
    name: "Monte Carlo Value at Risk",
    description: "Estimates portfolio risk using Monte Carlo simulation",
    workflowName: "Risk Assessment Pipeline",
    inputs: [
      { name: "portfolioValue", type: "number", value: 1000000, unit: "USD" },
      { name: "meanReturn", type: "number", value: 0.08, unit: "annual rate" },
      { name: "volatility", type: "number", value: 0.15, unit: "annual sigma" },
      { name: "confidenceLevel", type: "number", value: 0.95, unit: "percentile" },
      { name: "timePeriod", type: "number", value: 10, unit: "days" },
      { name: "simulations", type: "number", value: 10000, unit: "count" },
    ],
    outputs: [
      { name: "valueAtRisk", type: "number", value: 78432, unit: "USD" },
      { name: "expectedShortfall", type: "number", value: 94567, unit: "USD" },
      { name: "worstCaseLoss", type: "number", value: 156789, unit: "USD" },
    ],
    code: `function monteCarloVaR(portfolioValue, meanReturn, volatility, confidenceLevel, timePeriod, simulations) {
  // Convert annual parameters to daily
  const dailyMean = meanReturn / 252;
  const dailyVol = volatility / Math.sqrt(252);
  
  // Array to store simulated returns
  const simulatedReturns = [];
  
  // Run Monte Carlo simulations
  for (let i = 0; i < simulations; i++) {
    let cumulativeReturn = 1;
    
    // Simulate returns for the specified time period
    for (let day = 0; day < timePeriod; day++) {
      // Generate random normal variable using Box-Muller transform
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      // Calculate daily return using geometric Brownian motion
      const dailyReturn = Math.exp(dailyMean + dailyVol * z);
      cumulativeReturn *= dailyReturn;
    }
    
    // Calculate profit/loss
    const pnl = portfolioValue * (cumulativeReturn - 1);
    simulatedReturns.push(pnl);
  }
  
  // Sort returns for percentile calculation
  simulatedReturns.sort((a, b) => a - b);
  
  // Calculate VaR at the specified confidence level
  const varIndex = Math.floor(simulations * (1 - confidenceLevel));
  const valueAtRisk = -simulatedReturns[varIndex];
  
  // Calculate Expected Shortfall (average of losses beyond VaR)
  let esSum = 0;
  for (let i = 0; i < varIndex; i++) {
    esSum += -simulatedReturns[i];
  }
  const expectedShortfall = esSum / varIndex;
  
  // Worst case loss
  const worstCaseLoss = -simulatedReturns[0];
  
  return {
    valueAtRisk: valueAtRisk,
    expectedShortfall: expectedShortfall,
    worstCaseLoss: worstCaseLoss,
    returnDistribution: simulatedReturns
  };
}`,
    explanation:
      "This module uses Monte Carlo simulation to estimate Value at Risk (VaR) for a portfolio. It simulates thousands of possible price paths using geometric Brownian motion, then calculates the potential loss at a given confidence level. The module also computes Expected Shortfall (ES), which is the average loss in the worst scenarios beyond the VaR threshold.",
  },
  {
    id: "nonlinear-5",
    name: "Neural Network Predictor",
    description: "Simple neural network for time series prediction",
    workflowName: "Market Analysis",
    inputs: [
      {
        name: "historicalData",
        type: "array",
        value: [100, 102, 104, 103, 106, 110, 109, 112, 115, 114],
        unit: "values",
      },
      { name: "hiddenLayerSize", type: "number", value: 4, unit: "neurons" },
      { name: "learningRate", type: "number", value: 0.1, unit: "alpha" },
      { name: "epochs", type: "number", value: 1000, unit: "count" },
      { name: "predictionHorizon", type: "number", value: 3, unit: "periods" },
    ],
    outputs: [
      { name: "predictions", type: "array", value: [117, 119, 121], unit: "values" },
      { name: "trainingError", type: "number", value: 0.023, unit: "MSE" },
    ],
    code: `function neuralNetworkPredictor(historicalData, hiddenLayerSize, learningRate, epochs, predictionHorizon) {
  // Simple implementation of a single hidden layer neural network
  // In a real implementation, you would use a proper ML library
  
  // Normalize data between 0 and 1
  const min = Math.min(...historicalData);
  const max = Math.max(...historicalData);
  const normalizedData = historicalData.map(x => (x - min) / (max - min));
  
  // Prepare training data (use 3 inputs to predict 1 output)
  const inputSize = 3;
  const X = [];
  const y = [];
  
  for (let i = 0; i < normalizedData.length - inputSize; i++) {
    X.push(normalizedData.slice(i, i + inputSize));
    y.push(normalizedData[i + inputSize]);
  }
  
  // Initialize weights randomly
  const weights1 = Array(inputSize).fill().map(() => 
    Array(hiddenLayerSize).fill().map(() => Math.random() - 0.5)
  );
  
  const weights2 = Array(hiddenLayerSize).fill().map(() => Math.random() - 0.5);
  
  // Activation function (sigmoid)
  const sigmoid = x => 1 / (1 + Math.exp(-x));
  
  // Training loop
  let trainingError = 0;
  
  for (let epoch = 0; epoch < epochs; epoch++) {
    let epochError = 0;
    
    for (let i = 0; i < X.length; i++) {
      // Forward pass
      const hiddenLayer = [];
      for (let j = 0; j < hiddenLayerSize; j++) {
        let sum = 0;
        for (let k = 0; k < inputSize; k++) {
          sum += X[i][k] * weights1[k][j];
        }
        hiddenLayer.push(sigmoid(sum));
      }
      
      let output = 0;
      for (let j = 0; j < hiddenLayerSize; j++) {
        output += hiddenLayer[j] * weights2[j];
      }
      output = sigmoid(output);
      
      // Calculate error
      const error = y[i] - output;
      epochError += error * error;
      
      // Backpropagation (simplified)
      const outputDelta = error * output * (1 - output);
      
      // Update weights2
      for (let j = 0; j < hiddenLayerSize; j++) {
        weights2[j] += learningRate * outputDelta * hiddenLayer[j];
      }
      
      // Update weights1
      for (let j = 0; j < hiddenLayerSize; j++) {
        const hiddenDelta = outputDelta * weights2[j] * hiddenLayer[j] * (1 - hiddenLayer[j]);
        for (let k = 0; k < inputSize; k++) {
          weights1[k][j] += learningRate * hiddenDelta * X[i][k];
        }
      }
    }
    
    trainingError = epochError / X.length;
  }
  
  // Make predictions
  const predictions = [];
  let lastInputs = normalizedData.slice(-inputSize);
  
  for (let i = 0; i < predictionHorizon; i++) {
    // Forward pass for prediction
    const hiddenLayer = [];
    for (let j = 0; j < hiddenLayerSize; j++) {
      let sum = 0;
      for (let k = 0; k < inputSize; k++) {
        sum += lastInputs[k] * weights1[k][j];
      }
      hiddenLayer.push(sigmoid(sum));
    }
    
    let output = 0;
    for (let j = 0; j < hiddenLayerSize; j++) {
      output += hiddenLayer[j] * weights2[j];
    }
    output = sigmoid(output);
    
    // Denormalize prediction
    const prediction = output * (max - min) + min;
    predictions.push(prediction);
    
    // Update inputs for next prediction
    lastInputs.shift();
    lastInputs.push(output);
  }
  
  return {
    predictions: predictions,
    trainingError: trainingError
  };
}`,
    explanation:
      "This module implements a simple feedforward neural network for time series prediction. It uses a single hidden layer with sigmoid activation functions and trains using backpropagation. The network learns patterns from historical data and then makes predictions for future periods. In a real application, you would use a specialized library like TensorFlow.js for better performance and more advanced architectures.",
  },
]
