(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./tasks/fixSourceMaps", "./tasks/installPeerDependencies", "./tasks/link", "./tasks/release", "./tasks/rename", "./tasks/repl", "./tasks/run", "./tasks/ts", "./tasks/typedoc", "./tasks/uploadCoverage", "./tasks/util/process", "./tasks/util/postcss", "./tasks/util/Publisher", "./lib/load-dojo-loader"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    require("./tasks/fixSourceMaps");
    require("./tasks/installPeerDependencies");
    require("./tasks/link");
    require("./tasks/release");
    require("./tasks/rename");
    require("./tasks/repl");
    require("./tasks/run");
    require("./tasks/ts");
    require("./tasks/typedoc");
    require("./tasks/uploadCoverage");
    require("./tasks/util/process");
    require("./tasks/util/postcss");
    require("./tasks/util/Publisher");
    require("./lib/load-dojo-loader");
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYWxsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBQUEsaUNBQStCO0lBQy9CLDJDQUF5QztJQUN6Qyx3QkFBc0I7SUFDdEIsMkJBQXlCO0lBQ3pCLDBCQUF3QjtJQUN4Qix3QkFBc0I7SUFDdEIsdUJBQXFCO0lBQ3JCLHNCQUFvQjtJQUNwQiwyQkFBeUI7SUFDekIsa0NBQWdDO0lBQ2hDLGdDQUE4QjtJQUM5QixnQ0FBOEI7SUFDOUIsa0NBQWdDO0lBQ2hDLGtDQUFnQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnLi90YXNrcy9maXhTb3VyY2VNYXBzJztcbmltcG9ydCAnLi90YXNrcy9pbnN0YWxsUGVlckRlcGVuZGVuY2llcyc7XG5pbXBvcnQgJy4vdGFza3MvbGluayc7XG5pbXBvcnQgJy4vdGFza3MvcmVsZWFzZSc7XG5pbXBvcnQgJy4vdGFza3MvcmVuYW1lJztcbmltcG9ydCAnLi90YXNrcy9yZXBsJztcbmltcG9ydCAnLi90YXNrcy9ydW4nO1xuaW1wb3J0ICcuL3Rhc2tzL3RzJztcbmltcG9ydCAnLi90YXNrcy90eXBlZG9jJztcbmltcG9ydCAnLi90YXNrcy91cGxvYWRDb3ZlcmFnZSc7XG5pbXBvcnQgJy4vdGFza3MvdXRpbC9wcm9jZXNzJztcbmltcG9ydCAnLi90YXNrcy91dGlsL3Bvc3Rjc3MnO1xuaW1wb3J0ICcuL3Rhc2tzL3V0aWwvUHVibGlzaGVyJztcbmltcG9ydCAnLi9saWIvbG9hZC1kb2pvLWxvYWRlcic7XG4iXX0=