'use client'

import { useEffect, useState } from 'react'
import { client } from '../lib/sanity'

export default function Home() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])

  // Fetch products from Sanity on load
  useEffect(() => {
    client.fetch(`*[_type == "product"]{
      _id,
      name,
      price,
      description,
      "imageUrl": image.asset->url
    }`).then(data => {
      console.log("Sanity response:", data)
      setProducts(data)
    }).catch(err => {
      console.error("Sanity fetch failed:", err.message || err)
    })
  }, [])

  const addToCart = (product) => {
    setCart([...cart, product])
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <h1 className="text-4xl font-bold mb-10 text-center">Dysanum Store</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map(product => (
          <div key={product._id} className="bg-zinc-900 rounded-2xl overflow-hidden shadow-lg">
            <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h2 className="text-xl font-bold mb-2">{product.name}</h2>
              <p className="text-zinc-400 text-sm mb-4">{product.description}</p>
              <p className="text-lg font-semibold mb-4">${product.price}</p>
              <button
                onClick={() => addToCart(product)}
                className="bg-white text-black py-2 px-4 rounded hover:bg-gray-200"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 border-t border-zinc-700 pt-8">
        <h2 className="text-2xl font-bold mb-4">Cart</h2>
        {cart.length === 0 ? (
          <p className="text-zinc-400">Your cart is empty.</p>
        ) : (
          <>
            <ul className="space-y-2 mb-6">
              {cart.map((item, idx) => (
                <li key={idx} className="flex justify-between border-b border-zinc-700 pb-2">
                  <span>{item.name}</span>
                  <span>${item.price}</span>
                </li>
              ))}
            </ul>

            <button
  onClick={async () => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cart),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Checkout session failed. Please try again.')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Something went wrong. Please try again.')
    }
  }}
  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded"
>
  Checkout
</button>
          </>
        )}
      </div>
    </div>
  )
}
