// Shared utilities for the application

// Currency formatting utility
const currencify = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Color class utility for amounts
const getAmountColorClass = (amount) => {
  if (amount > 0) return 'text-positive'
  if (amount < 0) return 'text-negative'
  return 'text-grey-7'
}

// Default entries data
const defaultEntries = [
  { id: 'id1', name: 'Salary', amount: 4999.99 },
  { id: 'id2', name: 'Rent', amount: -999 },
  { id: 'id3', name: 'Phone', amount: -14.99 },
  { id: 'id4', name: 'Unknown', amount: 0 }
]
