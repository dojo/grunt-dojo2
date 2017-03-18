(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./tasks/fixSourceMaps", "./tasks/installPeerDependencies", "./tasks/link", "./tasks/release", "./tasks/rename", "./tasks/repl", "./tasks/run", "./tasks/ts", "./tasks/typedoc", "./tasks/uploadCoverage", "./tasks/util/process", "./tasks/util/Publisher", "./lib/load-dojo-loader"], factory);
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
    require("./tasks/util/Publisher");
    require("./lib/load-dojo-loader");
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYWxsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBQUEsaUNBQStCO0lBQy9CLDJDQUF5QztJQUN6Qyx3QkFBc0I7SUFDdEIsMkJBQXlCO0lBQ3pCLDBCQUF3QjtJQUN4Qix3QkFBc0I7SUFDdEIsdUJBQXFCO0lBQ3JCLHNCQUFvQjtJQUNwQiwyQkFBeUI7SUFDekIsa0NBQWdDO0lBQ2hDLGdDQUE4QjtJQUM5QixrQ0FBZ0M7SUFDaEMsa0NBQWdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICcuL3Rhc2tzL2ZpeFNvdXJjZU1hcHMnO1xuaW1wb3J0ICcuL3Rhc2tzL2luc3RhbGxQZWVyRGVwZW5kZW5jaWVzJztcbmltcG9ydCAnLi90YXNrcy9saW5rJztcbmltcG9ydCAnLi90YXNrcy9yZWxlYXNlJztcbmltcG9ydCAnLi90YXNrcy9yZW5hbWUnO1xuaW1wb3J0ICcuL3Rhc2tzL3JlcGwnO1xuaW1wb3J0ICcuL3Rhc2tzL3J1bic7XG5pbXBvcnQgJy4vdGFza3MvdHMnO1xuaW1wb3J0ICcuL3Rhc2tzL3R5cGVkb2MnO1xuaW1wb3J0ICcuL3Rhc2tzL3VwbG9hZENvdmVyYWdlJztcbmltcG9ydCAnLi90YXNrcy91dGlsL3Byb2Nlc3MnO1xuaW1wb3J0ICcuL3Rhc2tzL3V0aWwvUHVibGlzaGVyJztcbmltcG9ydCAnLi9saWIvbG9hZC1kb2pvLWxvYWRlcic7XG4iXX0=