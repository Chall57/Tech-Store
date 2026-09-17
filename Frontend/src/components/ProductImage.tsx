import { useState, type CSSProperties } from 'react'

export function ProductImage({ product, large = false }: { product: { name: string; imagePath: string; color?: string }; large?: boolean }) {
  const [failedPath, setFailedPath] = useState('')
  const available = product.imagePath && failedPath !== product.imagePath
  return <div className={`product-image${large ? ' product-image--large' : ''}`} style={{ '--product-color': product.color ?? '#262626' } as CSSProperties}>
    {available ? <img src={product.imagePath} alt={product.name} onError={() => setFailedPath(product.imagePath)} />
      : <div className="product-placeholder" data-image-reference={product.imagePath}><span>HW</span><strong>Imagem reservada</strong><small>{product.imagePath}</small></div>}
  </div>
}
