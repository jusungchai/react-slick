"use strict";

import React from "react";
import classnames from "classnames";
import {
  lazyStartIndex,
  lazyEndIndex,
  getPreClones
} from "./utils/innerSliderUtils";

const cloneUntilWith = (level, item, props) => {
  if (!React.isValidElement(item)) {
    return item;
  }

  if (level === 1) {
    return React.cloneElement(item, props);
  }

  return React.cloneElement(item, {
    children: React.Children.toArray(item.props.children).map(item =>
      cloneUntilWith(level - 1, item, props)
    )
  });
};

// given specifications/props for a slide, fetch all the classes that need to be applied to the slide
const getSlideClasses = spec => {
  let slickActive, slickCenter, slickCloned;
  let centerOffset, index;

  if (spec.rtl) {
    index = spec.slideCount - 1 - spec.index;
  } else {
    index = spec.index;
  }
  slickCloned = index < 0 || index >= spec.slideCount;
  if (spec.centerMode) {
    centerOffset = Math.floor(spec.slidesToShow / 2);
    slickCenter = (index - spec.currentSlide) % spec.slideCount === 0;
    if (
      index > spec.currentSlide - centerOffset - 1 &&
      index <= spec.currentSlide + centerOffset
    ) {
      slickActive = true;
    }
  } else {
    slickActive =
      spec.currentSlide <= index &&
      index < spec.currentSlide + spec.slidesToShow;
  }
  let slickCurrent = index === spec.currentSlide;
  return {
    "slick-slide": true,
    "slick-active": slickActive,
    "slick-center": slickCenter,
    "slick-cloned": slickCloned,
    "slick-current": slickCurrent // dubious in case of RTL
  };
};

const getSlideStyle = spec => {
  let style = {};

  if (spec.variableWidth === undefined || spec.variableWidth === false) {
    style.width = spec.slideWidth;
  }

  if (spec.fade) {
    style.position = "relative";
    if (spec.vertical) {
      style.top = -spec.index * parseInt(spec.slideHeight);
    } else {
      style.left = -spec.index * parseInt(spec.slideWidth);
    }
    style.opacity = spec.currentSlide === spec.index ? 1 : 0;
    style.transition =
      "opacity " +
      spec.speed +
      "ms " +
      spec.cssEase +
      ", " +
      "visibility " +
      spec.speed +
      "ms " +
      spec.cssEase;
  }

  return style;
};

const getKey = (child, fallbackKey) => child.key || fallbackKey;

const renderSlides = spec => {
  let key;
  let slides = [];
  let preCloneSlides = [];
  let postCloneSlides = [];
  let childrenCount = React.Children.count(spec.children);
  let startIndex = lazyStartIndex(spec);
  let endIndex = lazyEndIndex(spec);

  React.Children.forEach(spec.children, (elem, index) => {
    let child;
    let childOnClickOptions = {
      message: "children",
      index: index,
      slidesToScroll: spec.slidesToScroll,
      currentSlide: spec.currentSlide
    };

    // The library renders all slides, and when lazy loading renders
    // placeholders that may be eventually rehydrated when visible.
    const isHydratedSlide =
      !spec.lazyLoad ||
      (spec.lazyLoad && spec.lazyLoadedList.indexOf(index) >= 0);

    if (isHydratedSlide) {
      child = elem;
    } else {
      child = <div />;
    }

    let childStyle = getSlideStyle({ ...spec, index });
    let slideClass = child.props.className || "";
    let slideClasses = getSlideClasses({ ...spec, index });
    const isSlideActive = slideClasses["slick-active"];

    // The third child is the slide item provided to Slider, while its parents
    // are interal wrapping elements, here we pass down the active slide state.
    child = cloneUntilWith(3, child, {
      active: isSlideActive
    });

    // push a cloned element of the desired slide
    slides.push(
      React.cloneElement(child, {
        key: `slide-${index}`,
        id: `slide-${index}`,
        "data-index": index,
        className: classnames(slideClasses, slideClass),
        tabIndex: "-1",
        "aria-hidden": !isSlideActive,
        style: { outline: "none", ...(child.props.style || {}), ...childStyle },
        onClick: e => {
          child.props && child.props.onClick && child.props.onClick(e);
          if (spec.focusOnSelect) {
            spec.focusOnSelect(childOnClickOptions);
          }
        }
      })
    );

    // if slide needs to be precloned or postcloned
    if (spec.infinite && spec.fade === false) {
      let preCloneNo = childrenCount - index;
      if (
        preCloneNo <= getPreClones(spec) &&
        childrenCount !== spec.slidesToShow
      ) {
        key = -preCloneNo;
        if (key >= startIndex) {
          child = elem;
        }

        slideClasses = getSlideClasses({ ...spec, index: key });
        const isSlideActive = slideClasses["slick-active"];

        child = cloneUntilWith(3, child, {
          active: isSlideActive
        });

        preCloneSlides.push(
          React.cloneElement(child, {
            key: "precloned" + getKey(child, key),
            "data-index": key,
            tabIndex: "-1",
            className: classnames(slideClasses, slideClass),
            "aria-hidden": !isSlideActive,
            style: { ...(child.props.style || {}), ...childStyle },
            onClick: e => {
              child.props && child.props.onClick && child.props.onClick(e);
              if (spec.focusOnSelect) {
                spec.focusOnSelect(childOnClickOptions);
              }
            }
          })
        );
      }

      if (childrenCount !== spec.slidesToShow) {
        key = childrenCount + index;
        if (key < endIndex) {
          child = elem;
        }

        slideClasses = getSlideClasses({ ...spec, index: key });
        const isSlideActive = slideClasses["slick-active"];

        child = cloneUntilWith(3, child, {
          active: isSlideActive
        });

        postCloneSlides.push(
          React.cloneElement(child, {
            key: "postcloned" + getKey(child, key),
            "data-index": key,
            tabIndex: "-1",
            className: classnames(slideClasses, slideClass),
            "aria-hidden": !isSlideActive,
            style: { ...(child.props.style || {}), ...childStyle },
            onClick: e => {
              child.props && child.props.onClick && child.props.onClick(e);
              if (spec.focusOnSelect) {
                spec.focusOnSelect(childOnClickOptions);
              }
            }
          })
        );
      }
    }
  });

  if (spec.rtl) {
    return preCloneSlides.concat(slides, postCloneSlides).reverse();
  } else {
    return preCloneSlides.concat(slides, postCloneSlides);
  }
};

export class Track extends React.PureComponent {
  render() {
    const slides = renderSlides(this.props);
    const { onMouseEnter, onMouseOver, onMouseLeave } = this.props;
    const mouseEvents = { onMouseEnter, onMouseOver, onMouseLeave };
    return (
      <ul
        className="slick-track"
        style={this.props.trackStyle}
        {...mouseEvents}
      >
        {slides}
      </ul>
    );
  }
}
