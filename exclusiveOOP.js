<script type="text/javascript">
     var GridNS = (function () {

        // Id Generator class
        var IdGenerator = {};
        (function (obj, strPattern) {
            if(!strPattern) strPattern = "auto-generated-id-"; // default value, if not entered

            if (typeof strPattern != "string" || strPattern === undefined || strPattern === "")
                throw new TypeError(["Class IdGenerator, function constructor", "parameter strPattern is invalid"]);

            obj.str = strPattern;
            obj.id = 0;

            obj.next = function () {
                return this.str + ++this.id;
            }

            obj.previous = function () {
                if (this.id > 0) return this.str + (--this.id).toString();

                throw new Error(["Class IdGenerator, function previous", "there is no previuously generated ID"]);
            }

            obj.lastId = function () {
                if (this.id > 0) return this.str + this.id;

                throw new Error(["Class IdGenerator, function lastId", "there is no generated ID"]);
            }

            return obj;

        })(IdGenerator);

        var ExclusiveType = {
            Both: "Both",
            Row: "Row",
            Col: "Col",
            None: "None"
        }

        var Attributes = {
            "disabled": "disabled",
            "checked": "checked",
            "id": "id",
            "type": "type",
            "button": "button",
            "value": "value"
        }

        var HtmlElements = {
            "input": "input",
            "row": "tr"
        }
        
        var ExclusiveGrid = function (gridSavn, _exclusiveMatrix) {
            var savn = gridSavn;
            var isAnswered = false;
            var howManyAnswered = 0;
            var exclusiveMatrix = _exclusiveMatrix;

            var getGridRows = function (savn) {
                var rowsNodeList = savn.getElementsByTagName(HtmlElements.row);
                var rows = [];

                for (var row = 1; row < rowsNodeList.length; row++) {
                    rows.push(rowsNodeList[row]);
                }

                return rows;
            }

            var readGrid = function (savn) {
                var rows = getGridRows(savn);
                
                var matrix = [];
                for (var row = 0; row < rows.length; row++) {
                    var inputs = rows[row].getElementsByTagName(HtmlElements.input);
                    var inputObjects = [];
                    for (var col = 0; col < inputs.length; col++) {
                        // askia fix, this works for BJ as each input has its own id
                        // anyway, if the input doent have ID, we're setting one as this is fundamental for the exclusive class to work
                        if(!inputs[col].getAttribute(Attributes.id))
                            inputs[col].setAttribute(Attributes.id, IdGenerator.next());
                        // end of askia fix

                        var id = inputs[col].getAttribute(Attributes.id);
                        var type = inputs[col].getAttribute(Attributes.type);
                        var exclusiveType = exclusiveMatrix[row][col];
                        var input = new Input(id, row, col, exclusiveType, type);
                        inputObjects.push(input);
                    }

                    matrix.push(inputObjects);
                }
                
                return matrix;
            }

            var updateMatrix = function () {
                var answered = 0;

                for (var row = 0; row < matrix.length; row++) {
                    for (var col = 0; col < matrix[0].length; col++) {
                        matrix[row][col].update();

                        if(matrix[row][col].isSelected()) answered++;
                    }
                }

                isAnswered = (answered > 0)? true : false;
                howManyAnswered = answered;
            }

            var enableDisabledInputs = function (excludedById) {
                for (var row = 0; row < matrix.length; row++) {
                    for (var col = 0; col < matrix[0].length; col++) {
                        var input = matrix[row][col];
                        if(input.getDisabledById() == excludedById){
                            input.enable(excludedById);
                        }
                    }
                }
            }

            var matrix = readGrid(savn);

            var excludeInclude = function () {
                for (var row = 0; row < matrix.length; row++) {
                    for (var col = 0; col < matrix[0].length; col++) {
                        var input = matrix[row][col];
                        if(!input.isDisabled && 
                            input.getExclusiveType() != ExclusiveType.None && 
                            input.isSelected()){
                            excludeDispatcher(input);
                        }

                        if(!input.isDisabled && 
                            input.getExclusiveType() != ExclusiveType.None && 
                            !input.isSelected()){
                            enableDisabledInputs(input.id());
                        }
                    }
                }
            }

            var excludeDispatcher = function (input) {
                switch(input.getExclusiveType()){
                    case ExclusiveType.Row: 
                        excludeRow(input);
                        break;
                    case ExclusiveType.Col:
                        excludeCol(input);
                        break;
                    case ExclusiveType.Both:
                        excludeCol(input);
                        excludeRow(input);
                        break;
                }
            }

            var excludeRow = function (input) {
                var row = input.row();
                var currentCol = input.column();
                var disabledById = input.id();
                for (var col = 0; col < matrix[row].length; col++) {
                    var input = matrix[row][col];
                    if(col != currentCol) {
                        input.unSelect();
                        if(!input.isDisabled) {
                            input.disable(disabledById);
                        }
                    }
                }
            }

            var excludeCol = function (input) {
                var col = input.column();
                var currentRow = input.row();
                var disabledById = input.id();
                for (var row = 0; row < matrix.length; row++) {
                    var input = matrix[row][col];
                    if(row != currentRow) {
                        input.unSelect();
                        if(!input.isDisabled) {
                            input.disable(disabledById);
                        }
                    }
                }
            }

            var run = function () {
                savn.onclick = function (){
                    updateMatrix();
                    excludeInclude();
                }

				var inputs = savn.getElementsByTagName("input");
				for(var i=0; i<inputs.length; i++){
					inputs[i].onclick = function () {
						updateMatrix();
						excludeInclude();
					}
				}
            }

            var resetGrid = function () {
                isAnswered = false;
                howManyAnswered = 0;

                for (var row = 0; row < matrix.length; row++) {
                    for (var col = 0; col < matrix[0].length; col++) {
                        matrix[row][col].reset();
                    }
                }
            }

            var appendResetButton = function (resetButtonValue){
                var reset = document.createElement(HtmlElements.input);
                reset.setAttribute(Attributes.type, Attributes.button);
                reset.setAttribute(Attributes.value, resetButtonValue);
                reset.onclick = function(){
                    resetGrid();
                }

                savn.parentNode.insertBefore(reset, savn.nextSibling);
            }

            var applyOutOfInputFix = function () {
                var rows = getGridRows(savn);
                for (var row = 0; row < rows.length; row++) {
                    var inputs = rows[row].getElementsByTagName(HtmlElements.input);
                    for (var i = 0; i < inputs.length; i++) {
                        inputs[i].parentNode.onclick = null;
                        inputs[i].parentNode.parentNode.onclick = null;
                    }
                }
            }

            var getHowManyAnswered = function () {
                return howManyAnswered;
            }

            var IsAnswered = function () {
                return isAnswered;
            }

            var isAnsweredCol = function (colNumber) {
                if( typeof colNumber != "number")
                    throw new TypeError(["colNumber must be number"]);

                var result = false;
                for (var row = 0; row < matrix.length; row++) {
                    if(matrix[row][colNumber].isSelected()){
                        result = true;
                        break;
                    }
                }

                return result;
            }

            run();

            return {
                appendResetButton: appendResetButton,
                resetGrid: resetGrid,
                howManyAnswered: getHowManyAnswered,
                isAnswered: IsAnswered,
                isAnsweredCol: isAnsweredCol
            }
        }

        var Input = function (_id, _row, _column, _exclusiveType, _inputType) {
            var id = _id;
            var row = _row;
            var col = _column;
            var inputType = _inputType;
            var disabledById = undefined;

            var getIsSelected = function (id) {
                return document.getElementById(id).checked;
            }

            var getIsDisabled = function (id) {
                return document.getElementById(id).hasAttribute(Attributes.disabled);
            }

            var isSelected = getIsSelected(id);
            var exclusiveType = _exclusiveType || ExclusiveType.None;
            var isDisabled = getIsDisabled(id);

            var _isSelected = function () {
                return getIsSelected(id);
            }

            var _row = function () {
                return row;
            }

            var _column = function () {
                return col;
            }

            var _Id = function () {
                return id;
            }

            var select = function () {
                if(!isDisabled){
                    isSelected = true;
                    document.getElementById(id).setAttribute(Attributes.checked, true);
                }
            }

            var unSelect = function () {
                if(!isDisabled){
                    isSelected = false;
                    document.getElementById(id).removeAttribute(Attributes.checked);
                    document.getElementById(id).checked = false;
                }
            }

            var disable = function (idOfInputWhichExcludes) {
                disabledById = idOfInputWhichExcludes;
                isDisabled = true;
                document.getElementById(id).setAttribute(Attributes.disabled, true);
            }

            var enable = function (idOfInputWhichExcludes) {
                if(disabledById == idOfInputWhichExcludes){
                    isDisabled = false;
                    document.getElementById(id).removeAttribute(Attributes.disabled);
                }
            }

            var setExclusiveType = function (ExclusiveType) {
                exclusiveType = ExclusiveType;
            }

            var getExclusiveType = function () {
                return exclusiveType;
            }

            var getDisabledById = function () {
                return disabledById;
            }

            var update = function () {
                var input = document.getElementById(id);
                isSelected = getIsSelected(id);
                isDisabled = getIsDisabled(id);
            }

            var reset = function (){
                isDisabled = false;
                isSelected = false;
                enable(disabledById);
                unSelect();
                disabledById = undefined;
            }

            return{
                id: _Id,
                row: _row,
                column: _column,
                isSelected: _isSelected,
                isDisabled: isDisabled,
                select: select,
                unSelect: unSelect,
                disable: disable,
                enable: enable,
                setExclusiveType: setExclusiveType,
                getExclusiveType: getExclusiveType,
                getDisabledById: getDisabledById,
                update: update,
                reset: reset
            }
        }

        return{
            ExclusiveGrid: ExclusiveGrid,
            ExclusiveType: ExclusiveType 
        }
    })();
</script>

<!-- Initialization -->
<script type="text/javascript">
	$(document).ready(function () {
    
        //4 questions x 2 responses, exclusive types are Row, Col, Both and None
        var Type = GridNS.ExclusiveType;
		var exclusives = [];
		exclusives[0] = new Array(Type.Both,Type.Both,Type.Both,Type.Both, Type.Both);
		exclusives[1] = new Array(Type.Both,Type.Both,Type.Both,Type.Both, Type.Both);
		exclusives[2] = new Array(Type.Both,Type.Both,Type.Both,Type.Both, Type.Both);
		exclusives[3] = new Array(Type.Both,Type.Both,Type.Both,Type.Both, Type.Both);
		exclusives[4] = new Array(Type.Both,Type.Both,Type.Both,Type.Both, Type.Both);
		exclusives[5] = new Array(Type.Both,Type.Both,Type.Both,Type.Both, Type.Both);

		var savngrid = document.getElementById("savnGrid");
        var grid = new GridNS.ExclusiveGrid(savngrid, exclusives);
        grid.appendResetButton("Reset Selection");
    });
</script>