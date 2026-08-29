/**
 * ArcadeVerse Level Data Configuration
 * Level ID: 9
 * Procedurally defined layout vectors coordinates.
 */

const Level_9_Data = {
    id: 9,
    bg: '#2c1e05',
    grid: [
        "                         E                      C C #    E         #                                     #        #           #   E # C               ",
        "              E C            E  E C ##   C   C     E                         #C         C     E                                  ## #  #              ",
        "                     C    #  C                                    #           C      #          E                                         E           ",
        "                  #                         E        CCC  E   C            C^                    E      #          C       E                          ",
        "      C  E       E             #   #   E             ^          EEC           # E            ^              C              E  E          CE           ",
        "                 #     E        C  C    ##                     ##C                     #             E #        #   #                                 ",
        "          E #^                                  C      ^           #  #            #              E#   #         #            E      ^                ",
        "        C            C          #^           C     E     C      #              #                                      #    #   C        #             ",
        "                     C          E                #E                #   #     CC         #   E  C                       C                   #          ",
        "        C   ^                   E      C       #           #            ^                      #     ^              #    # #       C       #          ",
        "                    E                  E #                       #     #                     ^      #  C               #            #                 ",
        "              C      #     E     C       E   C             #  E                                    C             ^  #      #       EC       #         ",
        "                  E                                         C   C      #                                 ^^                        ^                  ",
        "  S            E                 # E                        C             C   CE                                            E   #      #    C Exit    ",
        "######################################################################################################################################################",
    ]
};

// Push into global platform levels repository
if (!window.ArcadeLevels) window.ArcadeLevels = [];
window.ArcadeLevels.push(Level_9_Data);
