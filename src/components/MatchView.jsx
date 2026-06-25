import { ArrowRight, Link2, MapPin, Truck } from "lucide-react";
import { TYPES, URGENCY, KIND } from "@/lib/constants";
import MapLinks from "@/components/MapLinks";

export default function MatchView({ matches, onSelectNeed, onSelectOffer }) {
  if (!matches.length) {
    return (
      <div className="rda-empty">
        No hay coincidencias todavía.<br />
        Publica ofertas de transporte, insumos o voluntarios para cerrar el ciclo.
      </div>
    );
  }

  return (
    <div className="rda-match-list">
      {matches.map(({ need, matches: offers }) => {
        const nt = TYPES[need.type];
        const nu = URGENCY[need.urgency];
        const transport = offers.filter((m) => m.offer.type === "transporte");
        const resources = offers.filter((m) => m.offer.type !== "transporte");

        return (
          <article key={need.id} className="rda-match-card">
            <header className="rda-match-need">
              <span className="rda-match-badge need">{KIND.need.label}</span>
              <button type="button" className="rda-match-need-btn" onClick={() => onSelectNeed(need.id)}>
                <b>{need.place}</b>
                <span><MapPin size={10} /> {need.zone} · {nt.label}</span>
              </button>
              <span className="rda-match-urg" style={{ color: nu.color }}>{nu.label}</span>
            </header>
            <p className="rda-match-detail">{need.detail}</p>
            <MapLinks lat={need.lat} lng={need.lng} label={need.place} compact />

            {resources.length > 0 && (
              <section className="rda-match-section">
                <h4><Link2 size={12} /> Recursos compatibles</h4>
                {resources.map(({ offer, reasons, km }) => (
                  <MatchOfferRow
                    key={offer.id}
                    offer={offer}
                    reasons={reasons}
                    km={km}
                    onSelect={() => onSelectOffer(offer.id)}
                  />
                ))}
              </section>
            )}

            {transport.length > 0 && (
              <section className="rda-match-section transport">
                <h4><Truck size={12} /> Transporte</h4>
                {transport.map(({ offer, reasons, km }) => (
                  <MatchOfferRow
                    key={offer.id}
                    offer={offer}
                    reasons={reasons}
                    km={km}
                    onSelect={() => onSelectOffer(offer.id)}
                  />
                ))}
              </section>
            )}
          </article>
        );
      })}
    </div>
  );
}

function MatchOfferRow({ offer, reasons, km, onSelect }) {
  const ot = TYPES[offer.type];
  return (
    <button type="button" className="rda-match-offer" onClick={onSelect}>
      <span className="rda-match-badge offer">{KIND.offer.label}</span>
      <span className="rda-match-offer-main">
        <b>{offer.place}</b>
        <span>{ot.label} · {offer.zone} · ~{Math.round(km)} km</span>
        <span className="rda-match-reasons">{reasons.join(" · ")}</span>
      </span>
      <ArrowRight size={14} className="rda-match-arrow" />
    </button>
  );
}
