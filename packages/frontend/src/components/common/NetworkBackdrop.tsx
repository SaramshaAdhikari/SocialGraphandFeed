/**
 * NetworkBackdrop:
 * Denser, finer, and subtly animated social graph network backdrop.
 * Nodes and connecting edges only — strictly non-interactive (pointer-events: none).
 * Restricted to the workspace canvas; recedes behind elevated cards without text competition.
 * Staggered organic movement across 3 sub-cluster animation groups.
 * Respects prefers-reduced-motion: reduce.
 */
export function NetworkBackdrop() {
  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0"
      aria-hidden="true"
    >
      <svg
        className="w-full h-full object-cover animate-network-breathe"
        viewBox="0 0 1440 1200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMin slice"
      >
        <defs>
          <radialGradient id="nodeGlowFine" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="var(--network-glow-opacity, 0.22)" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Primary Fine Connections */}
        <g
          stroke="var(--color-primary)"
          strokeWidth="0.75"
          className="network-edges network-drift-1"
          strokeLinecap="round"
        >
          <line x1="120" y1="35" x2="180" y2="25" />
          <line x1="180" y1="25" x2="245" y2="46" />
          <line x1="245" y1="46" x2="315" y2="30" />
          <line x1="315" y1="30" x2="380" y2="50" />
          <line x1="380" y1="50" x2="450" y2="28" />
          <line x1="450" y1="28" x2="525" y2="42" />
          <line x1="525" y1="42" x2="600" y2="28" />
          <line x1="600" y1="28" x2="675" y2="48" />
          <line x1="675" y1="48" x2="750" y2="26" />
          <line x1="750" y1="26" x2="825" y2="44" />
          <line x1="825" y1="44" x2="900" y2="28" />
          <line x1="900" y1="28" x2="975" y2="50" />
          <line x1="975" y1="50" x2="1050" y2="32" />
          <line x1="1050" y1="32" x2="1125" y2="46" />
          <line x1="1125" y1="46" x2="1200" y2="28" />
          <line x1="1200" y1="28" x2="1275" y2="48" />
          <line x1="1275" y1="48" x2="1345" y2="32" />
          <line x1="1345" y1="32" x2="1395" y2="45" />
          <line x1="45" y1="95" x2="95" y2="120" />
          <line x1="95" y1="120" x2="145" y2="88" />
          <line x1="45" y1="95" x2="60" y2="165" />
          <line x1="95" y1="120" x2="125" y2="190" />
          <line x1="60" y1="165" x2="85" y2="235" />
          <line x1="125" y1="190" x2="155" y2="255" />
          <line x1="85" y1="235" x2="155" y2="255" />
          <line x1="50" y1="335" x2="110" y2="365" />
          <line x1="110" y1="365" x2="165" y2="345" />
          <line x1="50" y1="335" x2="75" y2="425" />
          <line x1="110" y1="365" x2="135" y2="455" />
          <line x1="75" y1="425" x2="60" y2="515" />
          <line x1="135" y1="455" x2="130" y2="545" />
          <line x1="60" y1="515" x2="130" y2="545" />
          <line x1="65" y1="635" x2="130" y2="665" />
          <line x1="65" y1="635" x2="80" y2="725" />
          <line x1="130" y1="665" x2="145" y2="755" />
          <line x1="80" y1="725" x2="60" y2="815" />
          <line x1="145" y1="755" x2="125" y2="845" />
          <line x1="60" y1="815" x2="125" y2="845" />
          <line x1="50" y1="935" x2="115" y2="965" />
          <line x1="50" y1="935" x2="70" y2="1025" />
          <line x1="115" y1="965" x2="140" y2="1055" />
          <line x1="70" y1="1025" x2="90" y2="1125" />
          <line x1="140" y1="1055" x2="90" y2="1125" />
          <line x1="1060" y1="95" x2="1095" y2="150" />
          <line x1="1095" y1="150" x2="1055" y2="215" />
          <line x1="1055" y1="215" x2="1100" y2="275" />
          <line x1="1100" y1="275" x2="1065" y2="340" />
          <line x1="1065" y1="340" x2="1095" y2="415" />
          <line x1="1095" y1="415" x2="1055" y2="485" />
          <line x1="1055" y1="485" x2="1105" y2="555" />
          <line x1="1105" y1="555" x2="1065" y2="625" />
          <line x1="1065" y1="625" x2="1100" y2="700" />
          <line x1="1100" y1="700" x2="1060" y2="775" />
          <line x1="1060" y1="775" x2="1105" y2="850" />
          <line x1="1105" y1="850" x2="1065" y2="925" />
          <line x1="1065" y1="925" x2="1095" y2="1000" />
          <line x1="1095" y1="1000" x2="1060" y2="1075" />
          <line x1="1340" y1="90" x2="1395" y2="125" />
          <line x1="1395" y1="125" x2="1355" y2="190" />
          <line x1="1355" y1="190" x2="1405" y2="250" />
          <line x1="1405" y1="250" x2="1360" y2="310" />
          <line x1="1360" y1="310" x2="1395" y2="395" />
          <line x1="1395" y1="395" x2="1345" y2="460" />
          <line x1="1345" y1="460" x2="1405" y2="525" />
          <line x1="1405" y1="525" x2="1355" y2="590" />
          <line x1="1355" y1="590" x2="1395" y2="660" />
          <line x1="1395" y1="660" x2="1350" y2="730" />
          <line x1="1350" y1="730" x2="1405" y2="800" />
          <line x1="1405" y1="800" x2="1355" y2="870" />
          <line x1="1355" y1="870" x2="1395" y2="940" />
          <line x1="1395" y1="940" x2="1350" y2="1015" />
          <line x1="1350" y1="1015" x2="1400" y2="1085" />
        </g>

        {/* 2. Delicate Dashed Secondary Connections */}
        <g
          stroke="var(--color-primary)"
          strokeWidth="0.55"
          strokeDasharray="3 5"
          className="network-edges-subtle network-drift-2"
          strokeLinecap="round"
        >
          <line x1="120" y1="35" x2="245" y2="46" />
          <line x1="245" y1="46" x2="380" y2="50" />
          <line x1="380" y1="50" x2="525" y2="42" />
          <line x1="525" y1="42" x2="675" y2="48" />
          <line x1="675" y1="48" x2="825" y2="44" />
          <line x1="825" y1="44" x2="975" y2="50" />
          <line x1="975" y1="50" x2="1125" y2="46" />
          <line x1="1125" y1="46" x2="1275" y2="48" />
          <line x1="1275" y1="48" x2="1395" y2="45" />
          <line x1="145" y1="88" x2="125" y2="190" />
          <line x1="60" y1="165" x2="155" y2="255" />
          <line x1="165" y1="345" x2="135" y2="455" />
          <line x1="75" y1="425" x2="130" y2="545" />
          <line x1="85" y1="235" x2="50" y2="335" />
          <line x1="60" y1="515" x2="65" y2="635" />
          <line x1="130" y1="665" x2="80" y2="725" />
          <line x1="60" y1="815" x2="50" y2="935" />
          <line x1="115" y1="965" x2="70" y2="1025" />
          <line x1="260" y1="82" x2="320" y2="72" />
          <line x1="320" y1="72" x2="380" y2="85" />
          <line x1="230" y1="352" x2="290" y2="342" />
          <line x1="290" y1="342" x2="350" y2="358" />
          <line x1="240" y1="665" x2="300" y2="652" />
          <line x1="300" y1="652" x2="360" y2="670" />
          <line x1="235" y1="978" x2="295" y2="966" />
          <line x1="295" y1="966" x2="355" y2="982" />
          <line x1="1060" y1="95" x2="1055" y2="215" />
          <line x1="1055" y1="215" x2="1065" y2="340" />
          <line x1="1065" y1="340" x2="1055" y2="485" />
          <line x1="1055" y1="485" x2="1065" y2="625" />
          <line x1="1065" y1="625" x2="1060" y2="775" />
          <line x1="1060" y1="775" x2="1065" y2="925" />
          <line x1="1065" y1="925" x2="1060" y2="1075" />
          <line x1="1340" y1="90" x2="1355" y2="190" />
          <line x1="1355" y1="190" x2="1360" y2="310" />
          <line x1="1360" y1="310" x2="1345" y2="460" />
          <line x1="1345" y1="460" x2="1355" y2="590" />
          <line x1="1355" y1="590" x2="1350" y2="730" />
          <line x1="1350" y1="730" x2="1355" y2="870" />
          <line x1="1355" y1="870" x2="1350" y2="1015" />
          <line x1="1095" y1="150" x2="1340" y2="90" />
          <line x1="1100" y1="275" x2="1360" y2="310" />
          <line x1="1105" y1="555" x2="1355" y2="590" />
          <line x1="1100" y1="700" x2="1350" y2="730" />
          <line x1="1105" y1="850" x2="1355" y2="870" />
          <line x1="1095" y1="1000" x2="1350" y2="1015" />
          <line x1="120" y1="35" x2="45" y2="95" />
          <line x1="1345" y1="32" x2="1340" y2="90" />
        </g>

        {/* 3. Subtle Halos on Cluster Anchors */}
        <g className="network-glows network-drift-1">
          <circle cx="95" cy="120" r="8" fill="url(#nodeGlowFine)" />
          <circle cx="110" cy="365" r="8" fill="url(#nodeGlowFine)" />
          <circle cx="130" cy="665" r="8" fill="url(#nodeGlowFine)" />
          <circle cx="115" cy="965" r="8" fill="url(#nodeGlowFine)" />
          <circle cx="1095" cy="150" r="8" fill="url(#nodeGlowFine)" />
          <circle cx="1105" cy="555" r="8" fill="url(#nodeGlowFine)" />
          <circle cx="1105" cy="850" r="8" fill="url(#nodeGlowFine)" />
        </g>

        {/* 4. Fine Network Nodes — Staggered Movement Groups */}
        <g fill="var(--color-primary)" className="network-nodes network-drift-1">
          <circle cx="120" cy="35" r="2.4" />
          <circle cx="315" cy="30" r="1.6" />
          <circle cx="525" cy="42" r="1.6" />
          <circle cx="750" cy="26" r="2.4" />
          <circle cx="975" cy="50" r="1.6" />
          <circle cx="1200" cy="28" r="1.6" />
          <circle cx="1395" cy="45" r="2.4" />
          <circle cx="45" cy="95" r="1.5" />
          <circle cx="60" cy="165" r="1.5" />
          <circle cx="155" cy="255" r="2.4" />
          <circle cx="165" cy="345" r="1.5" />
          <circle cx="60" cy="515" r="2.4" />
          <circle cx="130" cy="665" r="1.5" />
          <circle cx="60" cy="815" r="1.5" />
          <circle cx="115" cy="965" r="1.5" />
          <circle cx="90" cy="1125" r="1.5" />
          <circle cx="1060" cy="95" r="1.4" />
          <circle cx="1100" cy="275" r="1.4" />
          <circle cx="1055" cy="485" r="1.4" />
          <circle cx="1100" cy="700" r="1.4" />
          <circle cx="1065" cy="925" r="2.2" />
          <circle cx="1340" cy="90" r="1.4" />
          <circle cx="1405" cy="250" r="1.4" />
          <circle cx="1345" cy="460" r="1.4" />
          <circle cx="1395" cy="660" r="2.2" />
          <circle cx="1355" cy="870" r="1.4" />
          <circle cx="1400" cy="1085" r="1.4" />
        </g>

        <g fill="var(--color-primary)" className="network-nodes network-drift-2">
          <circle cx="180" cy="25" r="1.6" />
          <circle cx="380" cy="50" r="2.4" />
          <circle cx="600" cy="28" r="1.6" />
          <circle cx="825" cy="44" r="1.6" />
          <circle cx="1050" cy="32" r="1.6" />
          <circle cx="1275" cy="48" r="1.6" />
          <circle cx="95" cy="120" r="2.4" />
          <circle cx="125" cy="190" r="1.5" />
          <circle cx="50" cy="335" r="1.5" />
          <circle cx="75" cy="425" r="1.5" />
          <circle cx="130" cy="545" r="1.5" />
          <circle cx="80" cy="725" r="1.5" />
          <circle cx="125" cy="845" r="1.5" />
          <circle cx="70" cy="1025" r="2.4" />
          <circle cx="260" cy="82" r="1.4" />
          <circle cx="320" cy="72" r="1.4" />
          <circle cx="230" cy="352" r="1.4" />
          <circle cx="290" cy="342" r="1.4" />
          <circle cx="240" cy="665" r="1.4" />
          <circle cx="300" cy="652" r="1.4" />
          <circle cx="235" cy="978" r="1.4" />
          <circle cx="295" cy="966" r="1.4" />
          <circle cx="1095" cy="150" r="2.2" />
          <circle cx="1065" cy="340" r="2.2" />
          <circle cx="1105" cy="555" r="1.4" />
          <circle cx="1060" cy="775" r="1.4" />
          <circle cx="1095" cy="1000" r="1.4" />
          <circle cx="1395" cy="125" r="2.2" />
          <circle cx="1360" cy="310" r="1.4" />
          <circle cx="1405" cy="525" r="1.4" />
          <circle cx="1350" cy="730" r="1.4" />
          <circle cx="1395" cy="940" r="2.2" />
        </g>

        <g fill="var(--color-primary)" className="network-nodes network-drift-3">
          <circle cx="245" cy="46" r="1.6" />
          <circle cx="450" cy="28" r="1.6" />
          <circle cx="675" cy="48" r="1.6" />
          <circle cx="900" cy="28" r="1.6" />
          <circle cx="1125" cy="46" r="2.4" />
          <circle cx="1345" cy="32" r="1.6" />
          <circle cx="145" cy="88" r="1.5" />
          <circle cx="85" cy="235" r="1.5" />
          <circle cx="110" cy="365" r="2.4" />
          <circle cx="135" cy="455" r="1.5" />
          <circle cx="65" cy="635" r="1.5" />
          <circle cx="145" cy="755" r="2.4" />
          <circle cx="50" cy="935" r="1.5" />
          <circle cx="140" cy="1055" r="1.5" />
          <circle cx="320" cy="72" r="1.4" />
          <circle cx="380" cy="85" r="1.4" />
          <circle cx="290" cy="342" r="1.4" />
          <circle cx="350" cy="358" r="1.4" />
          <circle cx="300" cy="652" r="1.4" />
          <circle cx="360" cy="670" r="1.4" />
          <circle cx="295" cy="966" r="1.4" />
          <circle cx="355" cy="982" r="1.4" />
          <circle cx="1055" cy="215" r="1.4" />
          <circle cx="1095" cy="415" r="1.4" />
          <circle cx="1065" cy="625" r="2.2" />
          <circle cx="1105" cy="850" r="1.4" />
          <circle cx="1060" cy="1075" r="1.4" />
          <circle cx="1355" cy="190" r="1.4" />
          <circle cx="1395" cy="395" r="2.2" />
          <circle cx="1355" cy="590" r="1.4" />
          <circle cx="1405" cy="800" r="1.4" />
          <circle cx="1350" cy="1015" r="1.4" />
        </g>
      </svg>
    </div>
  );
}

export default NetworkBackdrop;
