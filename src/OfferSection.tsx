import { recordCheckout } from '@/tracking';
import { productImages } from '@/productImages';
import './OfferSection.css';

function ProductImage({ bottles, featured }: { bottles: 2 | 3 | 6; featured: boolean }) {
  const images = productImages[bottles];
  const sources = (format: 'avif' | 'webp') => ([256, 512, 768] as const)
    .map(width => `${images[width][format]} ${width}w`).join(', ');
  const sizes = featured ? '250px' : '224px';
  return (
    <picture className="offer-product-picture">
      <source type="image/avif" srcSet={sources('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={sources('webp')} sizes={sizes} />
      <img className={`offer-product-image${featured ? ' offer-product-image-featured' : ''}`}
        src={images[512].webp} srcSet={sources('webp')} sizes={sizes}
        width={768} height={768} loading="lazy" decoding="async"
        alt={`Memo Vance Pro ${bottles} bottle package`} />
    </picture>
  );
}

function PaymentMethods() {
  return (
    <div className="payment-methods" aria-label="Accepted payment methods">
      <span>VISA</span><span>MC</span><span>DISCOVER</span><span>AMEX</span>
    </div>
  );
}

export default function OfferSection({ checkoutLinks }: { checkoutLinks: { two: string; six: string; three: string } }) {
  return (
          <div className="offer-inner">
            <div className="offer-cta">YES! I want to restore my memory now — choose your package below</div>
            <div className="offer-grid">
              <article className="offer-card">
                <div className="offer-card-content">
                  <span className="offer-eyebrow">2 BOTTLES</span>
                  <ProductImage bottles={2} featured={false} />
                  <p className="offer-price"><strong>$79</strong><span>PER BOTTLE</span></p>
                  <p className="offer-total">Total: $158</p>
                  <ul className="offer-features">
                    <li>15% DISCOUNT</li>
                    <li>60-DAY GUARANTEE</li>
                  </ul>
                  <a className="offer-button offer-button-standard" href={checkoutLinks.two} target="_blank" rel="noopener noreferrer" onClick={() => recordCheckout(158, 2)}>BUY NOW</a>
                  <PaymentMethods />
                </div>
              </article>

              <article className="offer-card offer-card-featured">
                <div className="offer-badge">BEST VALUE!</div>
                <div className="offer-card-content">
                  <span className="offer-eyebrow">6 BOTTLES</span>
                  <ProductImage bottles={6} featured={true} />
                  <p className="offer-price"><strong>$49</strong><span>PER BOTTLE</span></p>
                  <p className="offer-total">Total: $294</p>
                  <ul className="offer-features">
                    <li>YOU SAVE $294</li>
                    <li>50% DISCOUNT</li>
                    <li>60-DAY GUARANTEE</li>
                  </ul>
                  <a className="offer-button offer-button-featured" href={checkoutLinks.six} target="_blank" rel="noopener noreferrer" onClick={() => recordCheckout(294, 6)}>BUY NOW</a>
                  <PaymentMethods />
                </div>
              </article>

              <article className="offer-card">
                <div className="offer-card-content">
                  <span className="offer-eyebrow">3 BOTTLES</span>
                  <ProductImage bottles={3} featured={false} />
                  <p className="offer-price"><strong>$69</strong><span>PER BOTTLE</span></p>
                  <p className="offer-total">Total: $207</p>
                  <ul className="offer-features">
                    <li>YOU SAVE $90</li>
                    <li>30% DISCOUNT</li>
                    <li>60-DAY GUARANTEE</li>
                  </ul>
                  <a className="offer-button offer-button-standard" href={checkoutLinks.three} target="_blank" rel="noopener noreferrer" onClick={() => recordCheckout(207, 3)}>BUY NOW</a>
                  <PaymentMethods />
                </div>
              </article>
            </div>
          </div>
  );
}
