import "./Tabs.css";

export default function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`tabs__tab ${activeTab === tab.value ? "tabs__tab--active" : ""}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.icon && <tab.icon size={15} />}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
