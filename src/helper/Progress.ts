class Progress {
  private _text: string;
  private _symbol: string;
  private _numSymbols: number;
  private _maxSymbols: number;
  private _updateInterval: number;
  private _lastUpdate: number;

  constructor(text: string) {
    this._text = text;

    this._symbol = ".";
    this._numSymbols = 0;
    this._maxSymbols = 3;

    this._updateInterval = 15e2;
    this._lastUpdate = 0;
  }

  public start(): void {
    process.stdout.write(this._text);
    this._lastUpdate = Date.now();
  }

  public update(): void {
    if (Date.now() - this._lastUpdate < this._updateInterval) {
      return;
    }

    process.stdout.cursorTo(this._text.length + this._numSymbols);
    process.stdout.clearLine(1);
    process.stdout.write(this._symbol);

    this._numSymbols = ++this._numSymbols % this._maxSymbols;
    this._lastUpdate = Date.now();
  }
}

export { Progress };
