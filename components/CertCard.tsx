import type { Block, Cert } from "@/lib/types";
import { Checklist } from "./Checklist";

function BlockView({ block, optional }: { block: Block; optional: boolean }) {
  const fillClass = optional ? "weight-fill alt" : "weight-fill";
  return (
    <div className="body-block">
      <h3>{block.heading}</h3>
      {block.type === "prose" && <p className="resources" dangerouslySetInnerHTML={{ __html: block.text }} />}
      {block.type === "weights" && (
        <div>
          {block.items.map((w, i) => (
            <div className="weight-row" key={i}>
              <div className="weight-label">{w.label}</div>
              <div className="weight-track">
                <div className={fillClass} style={{ width: `${w.pct}%` }} />
              </div>
              <div className="weight-pct">{w.display}</div>
            </div>
          ))}
        </div>
      )}
      {block.type === "checklist" && <Checklist items={block.items} />}
      {block.type === "checklist-grouped" && (
        <div>
          {block.groups.map((g, i) => (
            <div className="concept-group" key={i}>
              <div className="g-title">{g.title}</div>
              <Checklist items={g.items} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CertCard({ cert, optional }: { cert: Cert; optional: boolean }) {
  const numClass = optional ? "cert-num opt-num" : "cert-num";
  const cardClass = optional ? "cert-card optional" : "cert-card";

  return (
    <div className={cardClass} data-cert={cert.id}>
      <div className="cert-head">
        <div className={numClass}>{cert.num}</div>
        <div className="cert-title">
          <h2>{cert.title}</h2>
          <div className="issuer">{cert.issuer}</div>
        </div>
      </div>
      <div className="cert-facts">
        {cert.facts.map((f, i) => {
          const [label, ...rest] = f.split(":");
          return (
            <span key={i}>
              <b>{label}:</b>
              {rest.join(":")}
            </span>
          );
        })}
        {cert.estTime && <span className="est-time">✓ {cert.estTime}</span>}
      </div>
      <div className="cert-body">
        {cert.trigger && (
          <div className="trigger-note">
            <span>🎯</span>
            <span>
              <b>Trigger:</b> <span dangerouslySetInnerHTML={{ __html: cert.trigger }} />
            </span>
          </div>
        )}
        {cert.blocks.map((block, i) => (
          <BlockView block={block} optional={optional} key={i} />
        ))}
      </div>
    </div>
  );
}
