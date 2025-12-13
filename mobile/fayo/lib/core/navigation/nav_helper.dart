import 'package:flutter/material.dart';
import 'package:persistent_bottom_nav_bar/persistent_bottom_nav_bar.dart';

class NavHelper {
  static void pushNewScreen(
    BuildContext context,
    Widget screen, {
    bool withNavBar = true,
  }) {
    PersistentNavBarNavigator.pushNewScreen(
      context,
      screen: screen,
      withNavBar: withNavBar,
      pageTransitionAnimation: PageTransitionAnimation.cupertino,
    );
  }

  static void pushNewScreenWithRouteSettings(
    BuildContext context,
    Widget screen, {
    bool withNavBar = true,
    RouteSettings? settings,
  }) {
    PersistentNavBarNavigator.pushNewScreenWithRouteSettings(
      context,
      screen: screen,
      settings: settings ?? const RouteSettings(),
      withNavBar: withNavBar,
      pageTransitionAnimation: PageTransitionAnimation.cupertino,
    );
  }
}

