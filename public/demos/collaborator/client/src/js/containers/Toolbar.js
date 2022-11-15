/* global $ */
/* global Communicator */

// Rather than referencing window.Communicator for all API calls,
// set Communicator as global to drop the prepended "window." for this module

// Note: Future improvement would be to drop the jQuery dependency for the toolbar

import React, { Component } from "react";
import { connect } from 'react-redux';
import { setDrawMode } from "../actions/viewActions";
import '../../css/NoteText.css';
import '../../css/Toolbar.css';

class Toolbar extends Component {

    constructor(props) {
        super(props);
        this._toolbarSelector = "#toolBar";
        this._screenElementSelector = "#canvas";
        this._submenuHeightOffset = 10;
        this._viewOrientationDuration = 500;
        this._activeSubmenu = null;
        this._hwvMethods = {};
        this._actions = {};
        this._isInit = false;
    }

    componentDidUpdate() {
        if (this.props.status === "Connecting...") return null;
        this._viewer = this.props.viewer;
        this._viewerSettings = new window.Communicator.Ui.Desktop.ViewerSettings(this.props.viewer);
        let _this = this;
        this._initIcons();
        window.$(".hoops-tool").bind("click", function (event) {
            event.preventDefault();
            _this._processButtonClick(event);
            return false;
        });
        window.$(".submenu-icon").bind("click", function (event) {
            event.preventDefault();
            _this._submenuIconClick(event.target);
            return false;
        });
        window.$(this._toolbarSelector).bind("touchmove", function (event) {
            event.originalEvent.preventDefault();
        });
        window.$(this._toolbarSelector).bind("mouseenter", function () {
            _this._mouseEnter();
        });
        window.$(this._toolbarSelector).bind("mouseleave", function () {
            _this._mouseLeave();
        });
        window.$(".tool-icon, .submenu-icon").bind("mouseenter", function (event) {
            _this._mouseEnterItem(event);
        });
        window.$(".tool-icon, .submenu-icon").bind("mouseleave", function (event) {
            _this._mouseLeaveItem(event);
        });
        window.$(window).resize(function () {
            _this.reposition();
        });
        window.$(this._toolbarSelector).click(function () {
            if (_this._activeSubmenu != null) {
                _this._hideActiveSubmenu();
            }
        });
        window.$(".toolbar-cp-plane").click(function (event) {
            _this._cuttingPlaneButtonClick(event);
        });
        this._viewer.setCallbacks({
            modelSwitched: function () {
                _this._hideActiveSubmenu();
            }
        });
        this._initSliders();
        this._initActions();
        this.updateEdgeFaceButton();
        this.reposition();
        this.show();
        this._isInit = true;
    }

    _initIcons() {
        window.$(this._toolbarSelector).find(".hoops-tool").each(function () {
            var $element = window.$(this);
            $element.find(".tool-icon").addClass($element.data("operatorclass").toString());
        });
        window.$(this._toolbarSelector).find(".submenu-icon").each(function () {
            var $element = window.$(this);
            $element.addClass($element.data("operatorclass").toString());
        });
    };

    _processButtonClick(event) {
        if (this._activeSubmenu != null) {
            this._hideActiveSubmenu();
        }
        else {
            var $tool = window.$(event.target).closest(".hoops-tool");
            if ($tool.hasClass("toolbar-radio")) {
                if ($tool.hasClass("active-tool")) {
                    this._showSubmenu(event.target);
                }
                else {
                    window.$(this._toolbarSelector).find(".active-tool").removeClass("active-tool");
                    $tool.addClass("active-tool");
                    this._performAction($tool.data("operatorclass"));
                }
            }
            else if ($tool.hasClass("toolbar-menu")) {
                this._showSubmenu(event.target);
            }
            else if ($tool.hasClass("toolbar-menu-toggle")) {
                this._toggleMenuTool($tool);
            }
            else {
                this._performAction($tool.data("operatorclass"));
            }
        }
    };

    handleMarkup(itemClicked) {
        let viewer = this.props.viewer;
        if (viewer.getOperatorManager().indexOf(window.Communicator.OperatorId[itemClicked]) !== -1)
            viewer.getOperatorManager().remove(window.Communicator.OperatorId[itemClicked]);
        viewer.getOperatorManager().push(window.Communicator.OperatorId[itemClicked]);
    }

    captureSnapshot(showModal = true) {
        let canvasSize = this.props.viewer.getView().getCanvasSize();
        let previewWidth = canvasSize.x;// * 0.8; // 80% of canvas size
        let previewHeight = canvasSize.y;// * 0.8;
        let config = new window.Communicator.SnapshotConfig(previewWidth, previewHeight);
        this.props.viewer.takeSnapshot(config).then(function (image) {
            var modal = document.getElementById('snapshotModal');
            var modalImg = document.getElementById("snapshotImg");
            if (showModal) modal.style.display = "block";
            modalImg.appendChild(image);

            var span = document.getElementsByClassName("closeSnap")[0];
            span.onclick = function () {
                modal.style.display = "none";
                modalImg.removeChild(image);
            };
        });
    }

    resetDefaultOperators() {
        let OM = this.props.viewer.getOperatorManager();
        OM.clear();
        OM.push(window.Communicator.OperatorId.Navigate);
        OM.push(window.Communicator.OperatorId.Select);
    }




    disableSubmenuItem(item) {
        if (typeof (item) === "string") {
            window.$("#submenus .toolbar-" + item).addClass("disabled");
        }
        else if (typeof (item) === "object") {
            window.$.each(item, function (k, v) {
                window.$("#submenus .toolbar-" + v).addClass("disabled");
            });
        }
    };
    enableSubmenuItem(item) {
        if (typeof (item) === "string") {
            window.$("#submenus .toolbar-" + item).removeClass("disabled");
        }
        else if (typeof (item) === "object") {
            window.$.each(item, function (k, v) {
                window.$("#submenus .toolbar-" + v).removeClass("disabled");
            });
        }
    };
    setCorrespondingButtonForSubmenuItem(value) {
        var $item = window.$("#submenus .toolbar-" + value);
        this._activateSubmenuItem($item);
    };
    _mouseEnterItem(event) {
        var $target = window.$(event.target);
        if (!$target.hasClass("disabled"))
            $target.addClass("hover");
    };
    _mouseLeaveItem(event) {
        window.$(event.target).removeClass("hover");
    };
    show() {
        window.$(this._toolbarSelector).show();
    };
    hide() {
        window.$(this._toolbarSelector).hide();
    };
    _initSliders() {
        var _this = this;
        $("#explosion-slider").slider({
            orientation: "vertical",
            min: 0,
            max: 200,
            value: 0,
            slide: function (event, ui) {
                _this._onExplosionSilder(ui.value / 100);
            }
        });
    };
    _mouseEnter() {
        if (this._activeSubmenu == null) {
            var $tools = window.$(this._toolbarSelector).find(".toolbar-tools");
            $tools.stop();
            $tools.css({
                opacity: 1.0
            });
        }
    };
    _mouseLeave() {
        if (this._activeSubmenu == null) {
            window.$(".toolbar-tools").animate({
                opacity: 0.6
            }, 500, function () {
            });
        }
    };
    reposition() {
        var $toolbar = window.$(this._toolbarSelector);
        var $screen = window.$(this._screenElementSelector);
        var canvasCenterX = $screen.width() / 2;
        var toolbarX = canvasCenterX - ($toolbar.width() / 2);
        $toolbar.css({
            left: toolbarX + "px",
            bottom: "calc(5% + 5px)"
        });
    };
    _toggleMenuTool($tool) {
        var $toggleMenu = window.$("#" + $tool.data("submenu"));
        if ($toggleMenu.is(":visible")) {
            $toggleMenu.hide();
            this._performAction($tool.data("operatorclass"), false);
        }
        else {
            this._alignMenuToTool($toggleMenu, $tool);
            this._performAction($tool.data("operatorclass"), true);
        }
    };
    _startModal() {
        var _this = this;
        window.$("body").append("<div id='toolbar-modal' class='toolbar-modal-overlay'></div>");
        window.$("#toolbar-modal").bind("click", function () {
            _this._hideActiveSubmenu();
        });
    };
    _alignMenuToTool($submenu, $tool) {
        var position = $tool.position();
        var topPos = -(this._submenuHeightOffset + $submenu.height());
        var leftpos = position.left - $submenu.width() / 2 + 20;
        $submenu.css({
            display: "block",
            top: topPos + "px",
            left: leftpos
        });
    };
    _showSubmenu(item) {
        this._hideActiveSubmenu();
        var $tool = window.$(item).closest(".hoops-tool");
        var submenuId = $tool.data("submenu");
        if (submenuId != null) {
            var $submenu = window.$(this._toolbarSelector + " #submenus #" + submenuId);
            if (!$submenu.hasClass("disabled")) {
                this._alignMenuToTool($submenu, $tool);
                this._activeSubmenu = $submenu[0];
                this._startModal();
                window.$(this._toolbarSelector).find(".toolbar-tools").css({
                    opacity: 0.3
                });
            }
        }
    };
    _hideActiveSubmenu() {
        $("#toolbar-modal").remove();
        if (this._activeSubmenu != null) {
            $(this._activeSubmenu).hide();
            $(this._toolbarSelector).find(".toolbar-tools").css({
                opacity: 1.0
            });
        }
        this._activeSubmenu = null;
    };
    _activateSubmenuItem(submenuItem) {
        var $submenu = submenuItem.closest(".toolbar-submenu");
        var action = submenuItem.data("operatorclass");
        var $tool = $('#' + $submenu.data("button"));
        var $icon = $tool.find(".tool-icon");
        if ($icon.length) {
            $icon.removeClass($tool.data("operatorclass").toString());
            $icon.addClass(action);
            $tool.data("operatorclass", action);
            $tool.attr("title", submenuItem.attr("title"));
        }
        return action;
    };
    _submenuIconClick(item) {
        var $selection = $(item);
        if ($selection.hasClass("disabled"))
            return;
        var action = this._activateSubmenuItem($selection);
        this._hideActiveSubmenu();
        this._performAction(action);
    };

    setSubmenuEnabled(button, enabled) {
        var $button = $("#" + button);
        var $submenu = $('#' + $button.data("submenu"));
        if (enabled) {
            $button.find(".smarrow").show();
            $submenu.removeClass("disabled");
        }
        else {
            $button.find(".smarrow").hide();
            $submenu.addClass("disabled");
        }
    };
    _performAction(action, arg) {
        if (arg === void 0) { arg = null; }
        var func = this._actions[action];
        if (func) {
            func.apply(null, [action, arg]);
        }
    };
    _renderModeClick(action) {
        let mode;
        switch (action) {
            case "toolbar-shaded":
                mode = "Shaded";
                break;
            case "toolbar-wireframe":
                mode = "Wireframe";
                break;
            case "toolbar-hidden-line":
                mode = "HiddenLine";
                break;
            default:
                mode = "WireframeOnShaded";
        }
        this.props.setDrawMode(mode)
        ;
    };

    _initActions() {
        var _this = this;
        this._actions["toolbar-home"] = function() {
            _this.props.socket.emit('goHome');
            _this.resetDefaultOperators();
        }
        this._actions["toolbar-redline-circle"] = function () { _this._viewer.getOperatorManager().set(Communicator.OperatorId.RedlineCircle, 1); };
        this._actions["toolbar-redline-freehand"] = function () { _this._viewer.getOperatorManager().set(Communicator.OperatorId.RedlinePolyline, 1); };
        this._actions["toolbar-redline-rectangle"] = function () { _this._viewer.getOperatorManager().set(Communicator.OperatorId.RedlineRectangle, 1); };
        this._actions["toolbar-redline-note"] = function () { _this._viewer.getOperatorManager().set(Communicator.OperatorId.RedlineText, 1); };
        this._actions["toolbar-note"] = function () { _this._viewer.getOperatorManager().set(Communicator.OperatorId.Note, 1); };
        this._actions["toolbar-select"] = function () { _this._viewer.getOperatorManager().set(Communicator.OperatorId.Select, 1); };
        this._actions["toolbar-area-select"] = function () { _this._viewer.getOperatorManager().set(Communicator.OperatorId.AreaSelect, 1); };
        this._actions["toolbar-orbit"] = function () { _this._viewer.getOperatorManager().set(Communicator.OperatorId.Navigate, 0); };
        this._actions["toolbar-turntable"] = function () { _this._viewer.getOperatorManager().set(Communicator.OperatorId.Turntable, 0); };
        this._actions["toolbar-walk"] = function () { _this._viewer.getOperatorManager().set(Communicator.OperatorId.Walk, 0); };
        this._actions["toolbar-face"] = function () { _this._orientToFace(); };
        this._actions["toolbar-measure-point"] = function () { _this._viewer.getOperatorManager().set(Communicator.OperatorId.MeasurePointPointDistance, 1); };
        this._actions["toolbar-measure-edge"] = function () { _this._viewer.getOperatorManager().set(Communicator.OperatorId.MeasureEdgeLength, 1); };
        this._actions["toolbar-measure-distance"] = function () { _this._viewer.getOperatorManager().set(Communicator.OperatorId.MeasureFaceFaceDistance, 1); };
        this._actions["toolbar-measure-angle"] = function () { _this._viewer.getOperatorManager().set(Communicator.OperatorId.MeasureFaceFaceAngle, 1); };
        this._actions["toolbar-cuttingplane"] = function (action, visibility) { };
        this._actions["toolbar-explode"] = function (action, visibility) { _this._explosionButtonClick(visibility); };
        this._actions["toolbar-settings"] = function (action, visibility) { _this._settingsButtonClick(); };
        var _renderModeClick = function (action) { _this._renderModeClick(action); };
        this._actions["toolbar-wireframeshaded"] = _renderModeClick;
        this._actions["toolbar-shaded"] = _renderModeClick;
        this._actions["toolbar-wireframe"] = _renderModeClick;
        this._actions["toolbar-hidden-line"] = _renderModeClick;
        this._actions["toolbar-front"] = function () { _this._viewer.getView().setViewOrientation(Communicator.ViewOrientation.Front, _this._viewOrientationDuration); };
        this._actions["toolbar-back"] = function () { _this._viewer.getView().setViewOrientation(Communicator.ViewOrientation.Back, _this._viewOrientationDuration); };
        this._actions["toolbar-left"] = function () { _this._viewer.getView().setViewOrientation(Communicator.ViewOrientation.Left, _this._viewOrientationDuration); };
        this._actions["toolbar-right"] = function () { _this._viewer.getView().setViewOrientation(Communicator.ViewOrientation.Right, _this._viewOrientationDuration); };
        this._actions["toolbar-bottom"] = function () { _this._viewer.getView().setViewOrientation(Communicator.ViewOrientation.Bottom, _this._viewOrientationDuration); };
        this._actions["toolbar-top"] = function () { _this._viewer.getView().setViewOrientation(Communicator.ViewOrientation.Top, _this._viewOrientationDuration); };
        this._actions["toolbar-iso"] = function () { _this._viewer.getView().setViewOrientation(Communicator.ViewOrientation.Iso, _this._viewOrientationDuration); };
        this._actions["toolbar-ortho"] = function () { _this._viewer.getView().setProjectionMode(Communicator.Projection.Orthographic); };
        this._actions["toolbar-persp"] = function () { _this._viewer.getView().setProjectionMode(Communicator.Projection.Perspective); };
        this._actions["toolbar-snapshot"] = function () { _this.captureSnapshot(); };
    };
    _onExplosionSilder(value) {
        this._viewer.getExplodeManager().setMagnitude(value);
    };
    _explosionButtonClick(visibility) {
        var explodeManager = this._viewer.getExplodeManager();
        if (visibility && !explodeManager.getActive()) {
            this._viewer.getExplodeManager().start();
        }
    };
    _settingsButtonClick() {
        this._viewerSettings.show();
    };
    updateEdgeFaceButton() {
        var view = this._viewer.getView();
        var edgeVisibility = view.getLineVisibility();
        var faceVisibility = view.getFaceVisibility();
        if (edgeVisibility && faceVisibility)
            this.setCorrespondingButtonForSubmenuItem("wireframeshaded");
        else if (!edgeVisibility && faceVisibility)
            this.setCorrespondingButtonForSubmenuItem("shaded");
        else
            this.setCorrespondingButtonForSubmenuItem("wireframe");
    };
    _cuttingPlaneButtonClick(event) {
        var $element = $(event.target).closest(".toolbar-cp-plane");
        var planeAction = $element.data("plane");
        var initialCount = this._cuttingPlaneController.getCount();
        if (planeAction === "x" || planeAction === "y" || planeAction === "z" || planeAction === "face") {
            this._cuttingPlaneController.toggle(planeAction);
            $element.removeClass("selected");
            $element.removeClass("inverted");
            var count = this._cuttingPlaneController.getCount();
            if (count > initialCount) {
                $element.addClass("selected");
            }
            else if (count === initialCount && count > 0 && planeAction !== "face") {
                $element.addClass("inverted");
            }
            if (count > 0) {
                $("#cuttingplane-section").removeClass("disabled");
                $("#cuttingplane-reset").removeClass("disabled");
            }
            else {
                $("#cuttingplane-section").addClass("disabled");
                $("#cuttingplane-reset").addClass("disabled");
            }
            if (count > 1) {
                $("#cuttingplane-toggle").removeClass("disabled");
            }
            else {
                $("#cuttingplane-toggle").addClass("disabled");
            }
        }
        else if (planeAction === "section") {
            this._cuttingPlaneController.toggleReferenceGeometry();
            if ($element.hasClass("selected")) {
                $element.removeClass("selected");
            }
            else {
                $element.addClass("selected");
            }
        }
        else if (planeAction === "toggle") {
            this._cuttingPlaneController.toggleCuttingMode();
            if ($element.hasClass("selected")) {
                $element.removeClass("selected");
            }
            else {
                $element.addClass("selected");
            }
        }
        else if (planeAction === "reset") {
            this._cuttingPlaneController.resetCuttingPlanes();
            $("#cuttingplane-reset").addClass("disabled");
            $("#cuttingplane-section").addClass("disabled");
            $("#cuttingplane-section").removeClass("selected");
            $("#cuttingplane-toggle").addClass("disabled");
            $("#cuttingplane-toggle").removeClass("selected");
            $("#cuttingplane-x").removeClass("selected");
            $("#cuttingplane-y").removeClass("selected");
            $("#cuttingplane-z").removeClass("selected");
            $("#cuttingplane-face").removeClass("selected");
            $("#cuttingplane-x").removeClass("inverted");
            $("#cuttingplane-y").removeClass("inverted");
            $("#cuttingplane-z").removeClass("inverted");
            $("#cuttingplane-face").removeClass("inverted");
        }
    };
    ;
    _orientToFace = function () {
        var selectionItem = this._viewer.getSelectionManager().getLast();
        if (selectionItem && selectionItem.getFaceEntity()) {
            var normal = selectionItem.getFaceEntity().getNormal();
            var position = selectionItem.getPosition();
            var camera = this._viewer.getView().getCamera();
            var up = Communicator.Point3.cross(normal, new Communicator.Point3(0, 1, 0));
            if (up.length() < .001) {
                up = Communicator.Point3.cross(normal, new Communicator.Point3(1, 0, 0));
            }
            var zoomDelta = camera.getPosition().subtract(camera.getTarget()).length();
            camera.setTarget(position);
            camera.setPosition(Communicator.Point3.add(position, Communicator.Point3.scale(normal, zoomDelta)));
            camera.setUp(up);
            this._viewer.getView().fitBounding(selectionItem.getFaceEntity().getBounding(), 400, camera);
        }
    };


    setViewOrientation(selection) {
        this.props.viewer.getView().setViewOrientation(window.Communicator.ViewOrientation[selection]);
        this.resetDefaultOperators();
    }


    render() {
        return (
            <div id="toolBar">
                <div className="toolbar-tools">
                    <div id="home-button" title="Reset Camera" data-operatorclass="toolbar-home" className="hoops-tool">
                        <div className="tool-icon" ></div>
                    </div>
                    <div id="tool_separator_1" className="tool-separator"></div>
                    <div id="view-button" title="Camera Menu" data-operatorclass="toolbar-camera" data-submenu="view-submenu" className="hoops-tool toolbar-menu">
                        <div className="tool-icon"
                                onClick={(e) => {this._showSubmenu(e.target)}}>
                        </div>
                    </div>
                    <div id="camera-button" title="Orbit Camera" data-operatorclass="toolbar-orbit" data-submenu="camera-submenu" className="hoops-tool toolbar-menu">
                        <div className="tool-icon"></div>
                    </div>
                    <div id="edgeface-button" title="Wireframe on Shaded" data-operatorclass="toolbar-wireframeshaded" data-submenu="edgeface-submenu" className="hoops-tool toolbar-menu">
                        <div className="tool-icon"
                                onClick= {(e) => {this._showSubmenu(e.target)}}>
                        </div>
                    </div>
                    <div id="tool_separator_2" className="tool-separator"></div>
                    <div id="explode-button" title="Explode Menu" data-operatorclass="toolbar-explode" data-submenu="explode-slider" className="hoops-tool toolbar-menu-toggle">
                        <div className="tool-icon"></div>
                    </div>
                    <div id="redline-button" title="Redline Freehand" data-operatorclass="toolbar-redline-freehand" data-submenu="redline-submenu" className="hoops-tool toolbar-radio">
                        {/* <div className="smarrow"></div> */}
                        <div className="tool-icon"></div>
                    </div>
                    <div id="click-button" title="Select" data-operatorclass="toolbar-select" data-submenu="click-submenu" className="hoops-tool toolbar-radio">
                        {/* <div className="smarrow"></div> */}
                        <div className="tool-icon"></div>
                    </div>
                    {/* <div id="cuttingplane-button" title="Cutting Plane Menu" data-operatorclass="toolbar-cuttingplane" data-submenu="cuttingplane-submenu" className="hoops-tool toolbar-menu-toggle">
                        <div className="tool-icon"></div>
                    </div> */}
                    <div id="tool_separator_4" className="tool-separator"></div>
                    <div id="snapshot-button" title="Snapshot" data-operatorclass="toolbar-snapshot" className="hoops-tool">
                        <div className="tool-icon"
                            
                            ></div>
                    </div>
                    {/* <div id="settings-button" title="Settings" data-operatorclass="toolbar-settings" className="hoops-tool">
                        <div className="tool-icon"></div>
                    </div> */}
                </div>
                <div id="submenus">
                    <div id="redline-submenu" data-button="redline-button" className="toolbar-submenu submenus">
                        <table>
                            <tr>
                                {/* <td><div id="redline-note" title="Redline Note" data-operatorclass="toolbar-redline-note" className="submenu-icon"></div></td> */}
                                <td><div id="redline-freehand" title="Redline Freehand" data-operatorclass="toolbar-redline-freehand" className="submenu-icon"></div></td>
                            </tr>
                            <tr>
                                <td><div id="redline-circle-button" title="Redline Cirlce" data-operatorclass="toolbar-redline-circle" className="submenu-icon"></div></td>
                                <td><div id="redline-rectangle-button" title="Redline Rectangle" data-operatorclass="toolbar-redline-rectangle" className="submenu-icon"></div></td>
                            </tr>
                        </table>
                    </div>
                    <div id="camera-submenu" data-button="camera-button" className="toolbar-submenu submenus">
                        <table>
                            <tr>
                                <td><div id="operator-camera-walk" title="Walk" data-operatorclass="toolbar-walk" className="submenu-icon"></div></td>
                            </tr>
                            <tr>
                                <td><div id="operator-camera-turntable" title="Turntable" data-operatorclass="toolbar-turntable" className="submenu-icon"></div></td>
                            </tr>
                            <tr>
                                <td><div id="operator-camera-orbit" title="Orbit Camera" data-operatorclass="toolbar-orbit" className="submenu-icon"></div></td>
                            </tr>
                        </table>
                    </div>
                    <div id="edgeface-submenu" data-button="edgeface-button" className="toolbar-submenu submenus">
                        <table>
                            <tr>
                                <td><div id="viewport-wireframe-on-shaded" title="Shaded With Lines" data-operatorclass="toolbar-wireframeshaded" className="submenu-icon"></div></td>
                            </tr>
                            <tr>
                                <td><div id="viewport-shaded" title="Shaded" data-operatorclass="toolbar-shaded" className="submenu-icon"></div></td>
                            </tr>
                            <tr>
                                <td><div title="Hidden Line" data-operatorclass="toolbar-hidden-line" className="submenu-icon"></div></td>
                            </tr>
                            <tr>
                                <td><div id="viewport-wireframe" title="Wireframe" data-operatorclass="toolbar-wireframe" className="submenu-icon"></div></td>
                            </tr>
                        </table>
                    </div>
                    <div id="view-submenu" className="toolbar-submenu submenus">
                        <table>
                            <tr>
                                <td><div id="view-face" title="Orient Camera To Selected Face" data-operatorclass="toolbar-face" className="submenu-icon disabled"></div></td>
                            </tr>
                            <tr>
                                <td><div id="view-iso" title="Iso View" data-operatorclass="toolbar-iso" className="submenu-icon"></div></td>
                                <td><div id="view-ortho" title="Orthographic Projection" data-operatorclass="toolbar-ortho" className="submenu-icon"></div></td>
                                <td><div id="view-persp" title="Perspective Projection" data-operatorclass="toolbar-persp" className="submenu-icon"></div></td>
                            </tr>
                            <tr>
                                <td><div id="view-left" title="Left View" data-operatorclass="toolbar-left" className="submenu-icon"></div></td>
                                <td><div id="view-right" title="Right View" data-operatorclass="toolbar-right" className="submenu-icon"></div></td>
                                <td><div id="view-bottom" title="Bottom View" data-operatorclass="toolbar-bottom" className="submenu-icon"></div></td>
                            </tr>
                            <tr>
                                <td><div id="view-front" title="Front View" data-operatorclass="toolbar-front" className="submenu-icon"></div></td>
                                <td><div id="view-back" title="Back View" data-operatorclass="toolbar-back" className="submenu-icon"></div></td>
                                <td><div id="view-top" title="Top View" data-operatorclass="toolbar-top" className="submenu-icon"></div></td>
                            </tr>
                        </table>
                    </div>
                    <div id="click-submenu" data-button="click-button" className="toolbar-submenu submenus">
                        <table>
                            <tr>
                                <td><div id="note-button" title="Create Note-Pin" data-operatorclass="toolbar-note" className="submenu-icon"></div></td>
                            </tr>
                            <tr>
                                <td><div id="measure-angle-between-faces" title="Measure Angle Between Faces" data-operatorclass="toolbar-measure-angle" className="submenu-icon"></div></td>
                                <td><div id="measure-distance-between-faces" title="Measure Distance Between Faces" data-operatorclass="toolbar-measure-distance" className="submenu-icon"></div></td>
                            </tr>
                            <tr>
                                <td><div id="measure-edges" title="Measure Edges" data-operatorclass="toolbar-measure-edge" className="submenu-icon"></div></td>
                                <td><div id="measure-point-to-point" title="Measure Point to Point" data-operatorclass="toolbar-measure-point" className="submenu-icon"></div></td>
                            </tr>
                            <tr>
                                <td><div id="select-parts" title="Select Parts" data-operatorclass="toolbar-select" className="submenu-icon"></div></td>
                                <td><div id="area-select" title="Area Select" data-operatorclass="toolbar-area-select" className="submenu-icon"></div></td>
                            </tr>
                        </table>
                    </div>
                    <div id="explode-slider" className="toolbar-submenu slider-menu submenus">
                        <div id="explosion-slider" style={{ height: 90 + 'px' }} className="toolbar-slider"></div>
                    </div>
                    {/* <div id="cuttingplane-submenu" className="toolbar-submenu cutting-plane submenus no-modal">
                        <table>
                            <tr>
                                <td>
                                    <div id="cuttingplane-face" title="Create Cutting Plane On Selected Face" data-plane="face" data-operatorclass="toolbar-cuttingplane-face" className="toolbar-cp-plane submenu-icon disabled"></div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div id="cuttingplane-x" title="Cutting Plane X" data-plane="x" data-operatorclass="toolbar-cuttingplane-x" className="toolbar-cp-plane submenu-icon"></div>
                                </td>
                                <td>
                                    <div id="cuttingplane-section" title="Cutting Plane Visibility Toggle" data-plane="section" data-operatorclass="toolbar-cuttingplane-section" className="toolbar-cp-plane submenu-icon disabled"></div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div id="cuttingplane-y" title="Cutting Plane Y" data-plane="y" data-operatorclass="toolbar-cuttingplane-y" className="toolbar-cp-plane submenu-icon"></div>
                                </td>
                                <td>
                                    <div id="cuttingplane-toggle" title="Cutting Plane Section Toggle" data-plane="toggle" data-operatorclass="toolbar-cuttingplane-toggle" className="toolbar-cp-plane submenu-icon disabled"></div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div id="cuttingplane-z" title="Cutting Plane Z" data-plane="z" data-operatorclass="toolbar-cuttingplane-z" className="toolbar-cp-plane submenu-icon"></div>
                                </td>
                                <td>
                                    <div id="cuttingplane-reset" title="Cutting Plane Reset" data-plane="reset" data-operatorclass="toolbar-cuttingplane-reset" className="toolbar-cp-plane submenu-icon disabled"></div>
                                </td>
                            </tr>
                        </table>
                    </div> */}
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        viewer: state.hc.hwv,
        socket: state.hc.socket,
        status: state.hc.status,
        //expMag: state.hc.explodeMag,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        setDrawMode: (mode) => {
            dispatch(setDrawMode(mode));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Toolbar);

