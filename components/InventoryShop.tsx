"use client"
import { useMemo, useState } from 'react'
import PixelPanel from './ui/PixelPanel'

export type Item = {
  id: string
  name: string
  desc?: string
  price: number
  icon?: string
  affectionDelta?: number
  emotion?: string
}

type Props = {
  coins: number
  inventory: Record<string, number>
  onClose: () => void
  onCoinsChange: (next: number) => void
  onInventoryChange: (next: Record<string, number>) => void
  onUseItem: (item: Item) => void
}

const shopCatalog: Item[] = [
  { id: 'gift_flowers', name: '像素花束', price: 20, affectionDelta: 5, emotion: 'happy' },
  { id: 'gift_tea', name: '抹茶拿铁', price: 15, affectionDelta: 3, emotion: 'shy' },
  { id: 'gift_cookie', name: '曲奇饼干', price: 10, affectionDelta: 2 },
  { id: 'gift_music', name: '磁带随身听', price: 30, affectionDelta: 6 },
]

export default function InventoryShop({ coins, inventory, onClose, onCoinsChange, onInventoryChange, onUseItem }: Props) {
  const [tab, setTab] = useState<'inventory' | 'shop'>('shop')
  const invList = useMemo<Item[]>(() => {
    return shopCatalog
      .map((it) => ({ ...it, count: inventory[it.id] || 0 }))
      .filter((it) => (it as any).count > 0)
  }, [inventory])

  function buy(item: Item) {
    if (coins < item.price) return
    const nextCoins = coins - item.price
    const nextInv = { ...inventory, [item.id]: (inventory[item.id] || 0) + 1 }
    onCoinsChange(nextCoins)
    onInventoryChange(nextInv)
  }

  function useItem(item: Item) {
    const count = inventory[item.id] || 0
    if (count <= 0) return
    const nextInv = { ...inventory, [item.id]: Math.max(0, count - 1) }
    onInventoryChange(nextInv)
    onUseItem(item)
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <PixelPanel className="relative z-10 w-[92%] max-w-[720px] p-3 sm:p-4 [image-rendering:pixelated]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2 text-sm">
            <button
              className={`px-3 py-1 border ${tab === 'shop' ? 'bg-white/15' : 'bg-transparent'} hover:bg-white/10`}
              onClick={() => setTab('shop')}
            >商城</button>
            <button
              className={`px-3 py-1 border ${tab === 'inventory' ? 'bg-white/15' : 'bg-transparent'} hover:bg-white/10`}
              onClick={() => setTab('inventory')}
            >背包</button>
          </div>
          <div className="text-sm">🪙 {coins}</div>
        </div>

        {tab === 'shop' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {shopCatalog.map((it) => (
              <PixelPanel key={it.id} className="p-3">
                <div className="text-base mb-1">{it.name}</div>
                <div className="text-xs text-white/70 mb-2">{it.desc || '像素风道具'}</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">🪙 {it.price}</div>
                  <button
                    className={`px-2 py-1 text-sm border ${coins >= it.price ? 'hover:bg-white/10' : 'opacity-50 cursor-not-allowed'}`}
                    onClick={() => buy(it)}
                    disabled={coins < it.price}
                  >购买</button>
                </div>
              </PixelPanel>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {invList.length === 0 && (
              <div className="col-span-full text-center text-white/60 py-8">背包空空如也</div>
            )}
            {invList.map((it) => (
              <PixelPanel key={it.id} className="p-3">
                <div className="text-base mb-1">{it.name} ×{(inventory[it.id] || 0)}</div>
                <div className="text-xs text-white/70 mb-2">{it.desc || '像素风道具'}</div>
                <div className="text-right">
                  <button className="px-2 py-1 text-sm border hover:bg-white/10" onClick={() => useItem(it)}>使用</button>
                </div>
              </PixelPanel>
            ))}
          </div>
        )}

        <div className="mt-4 text-right">
          <button className="px-3 py-1 text-sm border hover:bg-white/10" onClick={onClose}>关闭</button>
        </div>
      </PixelPanel>
    </div>
  )
}
