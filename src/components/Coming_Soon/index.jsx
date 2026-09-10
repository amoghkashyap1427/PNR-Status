import "./style.css";

const ComingSoon = ({ feature }) => {
  return (
    <div className="comingSoonPage">
      <div className="comingSoonCard">
        <i className="fa-solid fa-satellite-dish comingSoonIcon"></i>
        <h2 className="comingSoonTitle">{feature}</h2>
        <p className="comingSoonSub">FEATURE UNDER CONSTRUCTION</p>
        <div className="comingSoonBar">
          <div className="comingSoonFill"></div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;